-- Live ticket availability over WebSockets (Supabase Realtime).
--
-- Whenever tickets change (added to a cart, bought, listed, transferred...),
-- a trigger broadcasts a fresh availability snapshot for each affected event
-- on the channel "event:<event id>". Every open event page is subscribed and
-- updates its counts immediately. Broadcasts only go out when the
-- transaction commits, so a failed purchase never shows up.


-- The numbers an event page shows, as one JSON snapshot. Also callable by
-- the page itself, to catch up after connecting.
create function public.event_availability(p_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'event_id', p_event_id,
    'sections', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'available_count', a.available_count,
            'resale_count', a.resale_count,
            'resale_from_cents', a.resale_from_cents
          )
          order by a.sort_order
        )
        from public.section_availability a
        where a.event_id = p_event_id
      ),
      '[]'::jsonb
    ),
    -- Holds end silently (no row changes, so no broadcast). Pages re-check
    -- availability when the next hold runs out.
    'next_hold_expires_at', (
      select min(t.held_until)
      from public.tickets t
      where t.event_id = p_event_id and t.held_until > now()
    )
  )
$$;

grant execute on function public.event_availability(uuid) to anon, authenticated;


-- One broadcast per affected event per statement, not per ticket: adding 8
-- tickets to a cart updates 8 rows but sends a single message.
create function public.broadcast_ticket_changes()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_event_id uuid;
begin
  for v_event_id in select distinct event_id from changed_tickets loop
    begin
      -- Public broadcast: availability is public, like the event page.
      perform realtime.send(
        public.event_availability(v_event_id),
        'availability',
        'event:' || v_event_id,
        false
      );
    exception when others then
      -- Never let a broadcast problem (e.g. Realtime not installed, as in
      -- the test database) break a purchase.
      raise warning 'Could not broadcast availability for event %: %', v_event_id, sqlerrm;
    end;
  end loop;
  return null;
end;
$$;

create trigger tickets_broadcast_availability
  after update on public.tickets
  referencing new table as changed_tickets
  for each statement
  execute function public.broadcast_ticket_changes();


-- Let order pages hear about their own order being paid (Postgres Changes
-- respects Row Level Security, so buyers only see their own orders).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
