-- Tickets are now sold by section (General, Premium, Front row, ...) instead
-- of by numbered seat. Organizers set a price and a capacity per section,
-- and fans buy a quantity from a section.
--
-- Existing data is kept: every existing event gets one "General admission"
-- section holding all of its tickets, and seat numbers become ticket
-- numbers within that section.

create table public.ticket_sections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  price_cents int not null check (price_cents >= 0),
  capacity int not null check (capacity > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),

  unique (event_id, name)
);

alter table public.ticket_sections enable row level security;

-- Sections are created through create_event().
create policy "Ticket sections are viewable by everyone"
  on public.ticket_sections for select
  using (true);


-- Move existing tickets into one section per event -------------------------------

insert into public.ticket_sections (event_id, name, price_cents, capacity)
select event_id, 'General admission', min(price_cents), count(*)
from public.tickets
group by event_id;

alter table public.tickets
  add column section_id uuid references public.ticket_sections (id) on delete cascade;

update public.tickets t
set section_id = s.id
from public.ticket_sections s
where s.event_id = t.event_id;

alter table public.tickets alter column section_id set not null;

-- Seat numbers become ticket numbers, unique within a section.
alter table public.tickets rename column seat_number to number;
alter table public.tickets rename constraint tickets_seat_number_check to tickets_number_check;
alter table public.tickets drop constraint tickets_event_id_seat_number_key;
alter table public.tickets add constraint tickets_section_id_number_key unique (section_id, number);

-- Finds the next unsold tickets in a section quickly, however big it is.
create index tickets_available_idx on public.tickets (section_id, number)
  where status = 'available';

-- The event page no longer draws every seat, so venues can be much larger.
alter table public.venues drop constraint venues_capacity_check;
alter table public.venues add constraint venues_capacity_check check (capacity between 1 and 100000);


-- Per-section numbers for the event page -----------------------------------------

create view public.section_availability
with (security_invoker = true)
as
select
  s.id,
  s.event_id,
  s.name,
  s.description,
  s.price_cents,
  s.capacity,
  s.sort_order,
  count(t.id) filter (where t.status = 'available') as available_count,
  count(t.id) filter (where t.status = 'listed') as resale_count,
  min(t.list_price_cents) filter (where t.status = 'listed') as resale_from_cents
from public.ticket_sections s
left join public.tickets t on t.section_id = s.id
group by s.id;

grant select on public.section_availability to anon, authenticated;


-- Functions ----------------------------------------------------------------------

drop function public.create_event(text, text, public.event_category, timestamptz, uuid, int, text);
drop function public.buy_ticket(uuid);

-- Creates an event with its sections, and one ticket per spot in each
-- section. p_sections is a JSON array like
--   [{"name": "General", "description": "Standing", "price_cents": 4200, "capacity": 500}]
create function public.create_event(
  p_name text,
  p_artist text,
  p_category public.event_category,
  p_starts_at timestamptz,
  p_venue_id uuid,
  p_sections jsonb,
  p_image_url text default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_event_id uuid;
  v_venue_capacity int;
  v_section_count int;
  v_total int;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'organizer'
  ) then
    raise exception 'Only organizers can create events';
  end if;

  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'The event date must be in the future';
  end if;

  select capacity into v_venue_capacity from public.venues where id = p_venue_id;
  if not found then
    raise exception 'Venue not found';
  end if;

  v_section_count := case
    when jsonb_typeof(p_sections) = 'array' then jsonb_array_length(p_sections)
    else 0
  end;
  if v_section_count not between 1 and 10 then
    raise exception 'An event needs between 1 and 10 sections';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_sections) as s(value)
    where coalesce(trim(s.value ->> 'name'), '') = ''
       or coalesce((s.value ->> 'price_cents')::int, -1) < 0
       or coalesce((s.value ->> 'capacity')::int, 0) < 1
  ) then
    raise exception 'Each section needs a name, a price of zero or more, and at least one ticket';
  end if;

  if (
    select count(distinct lower(trim(s.value ->> 'name')))
    from jsonb_array_elements(p_sections) as s(value)
  ) < v_section_count then
    raise exception 'Section names must be different';
  end if;

  select sum((s.value ->> 'capacity')::int) into v_total
  from jsonb_array_elements(p_sections) as s(value);
  if v_total > v_venue_capacity then
    raise exception 'Sections add up to % tickets, but the venue holds %', v_total, v_venue_capacity;
  end if;

  insert into public.events (organizer_id, venue_id, name, artist, category, starts_at, image_url)
  values (auth.uid(), p_venue_id, p_name, nullif(trim(p_artist), ''), p_category, p_starts_at, p_image_url)
  returning id into v_event_id;

  insert into public.ticket_sections (event_id, name, description, price_cents, capacity, sort_order)
  select
    v_event_id,
    trim(s.value ->> 'name'),
    nullif(trim(s.value ->> 'description'), ''),
    (s.value ->> 'price_cents')::int,
    (s.value ->> 'capacity')::int,
    s.position
  from jsonb_array_elements(p_sections) with ordinality as s(value, position);

  insert into public.tickets (event_id, section_id, number, price_cents)
  select v_event_id, s.id, n, s.price_cents
  from public.ticket_sections s
  cross join lateral generate_series(1, s.capacity) as n
  where s.event_id = v_event_id;

  return v_event_id;
end;
$$;

-- Buys p_quantity unsold tickets from one section, all or nothing.
-- FOR UPDATE SKIP LOCKED: rows another buyer is taking at this moment are
-- skipped instead of waited on, so simultaneous buyers get different tickets
-- and nobody queues behind anyone else.
create function public.buy_tickets(p_section_id uuid, p_quantity int)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_buyer uuid := auth.uid();
  v_starts_at timestamptz;
  v_ticket_ids uuid[];
  v_found int;
begin
  if v_buyer is null then
    raise exception 'You must be signed in to buy tickets';
  end if;

  if p_quantity is null or p_quantity not between 1 and 8 then
    raise exception 'You can buy between 1 and 8 tickets at a time';
  end if;

  select e.starts_at into v_starts_at
  from public.ticket_sections s
  join public.events e on e.id = s.event_id
  where s.id = p_section_id;

  if not found then
    raise exception 'Section not found';
  end if;

  if v_starts_at <= now() then
    raise exception 'This event has already started';
  end if;

  select array_agg(id) into v_ticket_ids
  from (
    select id
    from public.tickets
    where section_id = p_section_id and status = 'available'
    order by number
    limit p_quantity
    for update skip locked
  ) as picked;

  v_found := coalesce(array_length(v_ticket_ids, 1), 0);
  if v_found = 0 then
    raise exception 'This section is sold out';
  elsif v_found < p_quantity then
    raise exception 'Only % left in this section', v_found;
  end if;

  update public.tickets
  set owner_id = v_buyer, status = 'sold'
  where id = any (v_ticket_ids);

  insert into public.ticket_transactions (ticket_id, from_user, to_user, price_cents, kind)
  select id, null::uuid, v_buyer, price_cents, 'purchase'::public.transaction_kind
  from public.tickets
  where id = any (v_ticket_ids);
end;
$$;

-- Buys a ticket another fan has listed for resale. The row lock makes
-- simultaneous buyers queue up, so only the first one gets it.
create function public.buy_resale_ticket(p_ticket_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_buyer uuid := auth.uid();
  v_ticket public.tickets;
begin
  if v_buyer is null then
    raise exception 'You must be signed in to buy tickets';
  end if;

  select * into v_ticket from public.tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'Ticket not found';
  end if;

  if (select starts_at from public.events where id = v_ticket.event_id) <= now() then
    raise exception 'This event has already started';
  end if;

  if v_ticket.status <> 'listed' then
    raise exception 'This ticket is not for sale';
  end if;

  if v_ticket.owner_id = v_buyer then
    raise exception 'You already own this ticket';
  end if;

  update public.tickets
  set owner_id = v_buyer, status = 'sold', list_price_cents = null
  where id = p_ticket_id;

  insert into public.ticket_transactions (ticket_id, from_user, to_user, price_cents, kind)
  values (p_ticket_id, v_ticket.owner_id, v_buyer, v_ticket.list_price_cents, 'resale');
end;
$$;

-- Only signed-in users may call these.
revoke execute on function public.create_event(text, text, public.event_category, timestamptz, uuid, jsonb, text) from public, anon;
revoke execute on function public.buy_tickets(uuid, int) from public, anon;
revoke execute on function public.buy_resale_ticket(uuid) from public, anon;

grant execute on function public.create_event(text, text, public.event_category, timestamptz, uuid, jsonb, text) to authenticated;
grant execute on function public.buy_tickets(uuid, int) to authenticated;
grant execute on function public.buy_resale_ticket(uuid) to authenticated;
