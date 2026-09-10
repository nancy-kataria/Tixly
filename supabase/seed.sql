-- Demo data: 3 organizers, 2 fans, 5 venues and 10 events.
-- Safe to run more than once. The demo accounts have no password, so nobody
-- can sign in as them.

-- Demo users. The on_auth_user_created trigger creates their profiles.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000'::uuid, u.id, 'authenticated', 'authenticated', u.email, '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', u.name), now(), now(),
  '', '', '', ''
from (values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'pulse-live@example.com',   'Pulse Live Events'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 'northside@example.com',    'Northside Sports Co.'),
  ('00000000-0000-4000-a000-000000000003'::uuid, 'curtain-call@example.com', 'Curtain Call Presents'),
  ('00000000-0000-4000-a000-000000000011'::uuid, 'jordan@example.com',       'Jordan Lee'),
  ('00000000-0000-4000-a000-000000000012'::uuid, 'sam@example.com',          'Sam Patel')
) as u(id, email, name)
on conflict (id) do nothing;

update public.profiles
set role = 'organizer'
where id in (
  '00000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000002',
  '00000000-0000-4000-a000-000000000003'
);

insert into public.venues (id, name, address, capacity, created_by)
values
  ('00000000-0000-4000-b000-000000000001', 'Harbor Amphitheater', '120 Bayfront Dr, Long Beach, CA',  120, '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-b000-000000000002', 'The Velvet Room',     '88 Sunset Blvd, Los Angeles, CA',   40, '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-b000-000000000003', 'Summit Arena',        '500 Arena Way, Anaheim, CA',       200, '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-b000-000000000004', 'Grand Oak Theater',   '2150 Oak St, Pasadena, CA',         80, '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-b000-000000000005', 'Riverside Field',     '1 Stadium Pl, Riverside, CA',      160, '00000000-0000-4000-a000-000000000002')
on conflict (id) do nothing;

-- Events. Times are local to Los Angeles.
insert into public.events (id, organizer_id, venue_id, name, artist, category, starts_at)
select e.id, e.organizer_id, e.venue_id, e.name, e.artist, e.category::public.event_category,
       e.local_time::timestamp at time zone 'America/Los_Angeles'
from (values
  -- Pulse Live Events
  ('00000000-0000-4000-c000-000000000001'::uuid, '00000000-0000-4000-a000-000000000001'::uuid, '00000000-0000-4000-b000-000000000001'::uuid,
   'Neon Tides: Summer''s End Tour', 'Neon Tides', 'music', '2026-10-03 19:30'),
  ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000002',
   'Midnight Static Live', 'Midnight Static', 'music', '2026-10-17 21:00'),
  ('00000000-0000-4000-c000-000000000003', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000002',
   'Golden Hour Jazz Night', 'The Golden Hour Quartet', 'music', '2026-11-07 20:00'),
  ('00000000-0000-4000-c000-000000000004', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000003',
   'Echo Valley Winter Festival', 'Various Artists', 'music', '2026-12-12 17:00'),
  -- Northside Sports Co.
  ('00000000-0000-4000-c000-000000000005', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000005',
   'Riverside Rockets vs. Bay City Mariners', 'Riverside Rockets', 'sports', '2026-10-10 13:00'),
  ('00000000-0000-4000-c000-000000000006', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000005',
   'SoCal Derby: Riverside vs. Anaheim', 'Riverside FC', 'sports', '2026-11-14 19:00'),
  ('00000000-0000-4000-c000-000000000007', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000003',
   'Summit Showdown Basketball Classic', 'Anaheim Summits', 'sports', '2026-12-05 18:30'),
  -- Curtain Call Presents
  ('00000000-0000-4000-c000-000000000008', '00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000002',
   'Stand-Up Saturdays with Maya Brooks', 'Maya Brooks', 'comedy', '2026-10-24 20:00'),
  ('00000000-0000-4000-c000-000000000009', '00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000004',
   'The Last Lighthouse', 'Grand Oak Players', 'theater', '2026-11-20 19:30'),
  ('00000000-0000-4000-c000-000000000010', '00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000004',
   'A Winter''s Tale, Reimagined', 'Grand Oak Players', 'theater', '2027-01-15 19:30')
) as e(id, organizer_id, venue_id, name, artist, category, local_time)
on conflict (id) do nothing;

-- One ticket per venue seat, at each event's face value.
insert into public.tickets (event_id, seat_number, price_cents)
select p.event_id, seat, p.price_cents
from (values
  ('00000000-0000-4000-c000-000000000001'::uuid, 6500),
  ('00000000-0000-4000-c000-000000000002', 4500),
  ('00000000-0000-4000-c000-000000000003', 3500),
  ('00000000-0000-4000-c000-000000000004', 8900),
  ('00000000-0000-4000-c000-000000000005', 3000),
  ('00000000-0000-4000-c000-000000000006', 4000),
  ('00000000-0000-4000-c000-000000000007', 5500),
  ('00000000-0000-4000-c000-000000000008', 2500),
  ('00000000-0000-4000-c000-000000000009', 5000),
  ('00000000-0000-4000-c000-000000000010', 6000)
) as p(event_id, price_cents)
join public.events e on e.id = p.event_id
join public.venues v on v.id = e.venue_id
cross join lateral generate_series(1, v.capacity) as seat
on conflict (event_id, seat_number) do nothing;

-- A few seats already bought by the demo fans, some listed for resale,
-- so the resale flow has something to show.
update public.tickets t
set owner_id = d.owner_id,
    status = d.status::public.ticket_status,
    list_price_cents = d.list_price_cents
from (values
  -- Jordan: 3 seats at Neon Tides (one listed), 1 at The Last Lighthouse
  ('00000000-0000-4000-c000-000000000001'::uuid, 1, '00000000-0000-4000-a000-000000000011'::uuid, 'sold',   null::int),
  ('00000000-0000-4000-c000-000000000001',       2, '00000000-0000-4000-a000-000000000011',       'sold',   null),
  ('00000000-0000-4000-c000-000000000001',       3, '00000000-0000-4000-a000-000000000011',       'listed', 8000),
  ('00000000-0000-4000-c000-000000000009',      11, '00000000-0000-4000-a000-000000000011',       'sold',   null),
  -- Sam: 2 seats at Midnight Static (one listed), 1 listed at The Last Lighthouse
  ('00000000-0000-4000-c000-000000000002',       5, '00000000-0000-4000-a000-000000000012',       'sold',   null),
  ('00000000-0000-4000-c000-000000000002',       6, '00000000-0000-4000-a000-000000000012',       'listed', 6000),
  ('00000000-0000-4000-c000-000000000009',      10, '00000000-0000-4000-a000-000000000012',       'listed', 5500)
) as d(event_id, seat_number, owner_id, status, list_price_cents)
where t.event_id = d.event_id
  and t.seat_number = d.seat_number
  and t.status = 'available';

-- Record those seats as purchases from the event.
insert into public.ticket_transactions (ticket_id, from_user, to_user, price_cents, kind)
select t.id, null::uuid, t.owner_id, t.price_cents, 'purchase'::public.transaction_kind
from public.tickets t
where t.owner_id in ('00000000-0000-4000-a000-000000000011', '00000000-0000-4000-a000-000000000012')
  and not exists (select 1 from public.ticket_transactions tt where tt.ticket_id = t.id);
