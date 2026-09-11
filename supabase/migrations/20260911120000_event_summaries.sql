-- One row per event with the numbers event cards show: cheapest ticket,
-- tickets left, tickets sold. security_invoker makes the view run with the
-- caller's permissions, so the tables' access rules still apply.
create view public.event_summaries
with (security_invoker = true)
as
select
  e.id,
  e.organizer_id,
  e.name,
  e.artist,
  e.category,
  e.starts_at,
  e.image_url,
  v.name as venue_name,
  v.address as venue_address,
  count(t.id) filter (where t.status = 'available') as available_count,
  count(t.id) filter (where t.status = 'listed') as resale_count,
  count(t.id) filter (where t.status <> 'available') as sold_count,
  -- least() ignores nulls, so this is the cheaper of the two when both exist.
  least(
    min(t.price_cents) filter (where t.status = 'available'),
    min(t.list_price_cents) filter (where t.status = 'listed')
  ) as from_price_cents
from public.events e
join public.venues v on v.id = e.venue_id
left join public.tickets t on t.event_id = e.id
group by e.id, v.id;

grant select on public.event_summaries to anon, authenticated;
