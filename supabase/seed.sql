-- Demo data: 3 organizers, 2 fans, 5 venues and 10 events with 2-3 ticket
-- sections each.
--
-- Safe to run more than once. Each run resets the demo events' sections,
-- tickets and ticket history to this starting state; events by other
-- organizers are untouched. The demo accounts have no password, so nobody
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
  ('00000000-0000-4000-b000-000000000001', 'Harbor Amphitheater', '120 Bayfront Dr, Long Beach, CA', 2000, '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-b000-000000000002', 'The Velvet Room',     '88 Sunset Blvd, Los Angeles, CA',   250, '00000000-0000-4000-a000-000000000001'),
  ('00000000-0000-4000-b000-000000000003', 'Summit Arena',        '500 Arena Way, Anaheim, CA',       6000, '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-b000-000000000004', 'Grand Oak Theater',   '2150 Oak St, Pasadena, CA',         800, '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-b000-000000000005', 'Riverside Field',     '1 Stadium Pl, Riverside, CA',      5000, '00000000-0000-4000-a000-000000000002')
on conflict (id) do update
  set name = excluded.name, address = excluded.address, capacity = excluded.capacity;

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

-- Reset the demo events' tickets. Ticket history goes first because it
-- points at the tickets; deleting a section deletes its tickets.
delete from public.ticket_transactions tt
using public.tickets t, public.events e
where tt.ticket_id = t.id
  and e.id = t.event_id
  and e.organizer_id in (
    '00000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-a000-000000000002',
    '00000000-0000-4000-a000-000000000003'
  );

delete from public.ticket_sections s
using public.events e
where e.id = s.event_id
  and e.organizer_id in (
    '00000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-a000-000000000002',
    '00000000-0000-4000-a000-000000000003'
  );

-- Sections. Each event's capacities add up to its venue's capacity.
insert into public.ticket_sections (event_id, sort_order, name, description, price_cents, capacity)
values
  -- Neon Tides @ Harbor Amphitheater (2,000)
  ('00000000-0000-4000-c000-000000000001', 1, 'General',           'Standing · open floor',            4200, 1400),
  ('00000000-0000-4000-c000-000000000001', 2, 'Premium',           'Reserved · center',                8500,  560),
  ('00000000-0000-4000-c000-000000000001', 3, 'Front row',         'Best view in the house',          12000,   40),
  -- Midnight Static @ The Velvet Room (250)
  ('00000000-0000-4000-c000-000000000002', 1, 'General admission', 'Standing',                         4500,  200),
  ('00000000-0000-4000-c000-000000000002', 2, 'Balcony',           'Reserved seats · early entry',     7500,   50),
  -- Golden Hour Jazz Night @ The Velvet Room (250)
  ('00000000-0000-4000-c000-000000000003', 1, 'General admission', 'Standing by the bar',              3500,  190),
  ('00000000-0000-4000-c000-000000000003', 2, 'Table seating',     'Shared tables by the stage',       5500,   60),
  -- Echo Valley Winter Festival @ Summit Arena (6,000)
  ('00000000-0000-4000-c000-000000000004', 1, 'General',           'Festival floor',                   8900, 5000),
  ('00000000-0000-4000-c000-000000000004', 2, 'VIP',               'Lounge access · fast-track entry', 17900, 1000),
  -- Rockets vs. Mariners @ Riverside Field (5,000)
  ('00000000-0000-4000-c000-000000000005', 1, 'Upper deck',        null,                               3000, 3000),
  ('00000000-0000-4000-c000-000000000005', 2, 'Lower bowl',        'Closer to the action',             5500, 1800),
  ('00000000-0000-4000-c000-000000000005', 3, 'Field level',       'Behind home plate',               12000,  200),
  -- SoCal Derby @ Riverside Field (5,000)
  ('00000000-0000-4000-c000-000000000006', 1, 'Supporters'' end',  'Standing · home fans',             4000, 2500),
  ('00000000-0000-4000-c000-000000000006', 2, 'Main stand',        'Reserved seating',                 6500, 2400),
  ('00000000-0000-4000-c000-000000000006', 3, 'Pitchside',         'Row A',                           14000,  100),
  -- Summit Showdown @ Summit Arena (6,000)
  ('00000000-0000-4000-c000-000000000007', 1, 'Upper level',       null,                               5500, 4000),
  ('00000000-0000-4000-c000-000000000007', 2, 'Lower level',       null,                               9500, 1900),
  ('00000000-0000-4000-c000-000000000007', 3, 'Courtside',         'Floor seats',                     25000,  100),
  -- Stand-Up Saturdays @ The Velvet Room (250)
  ('00000000-0000-4000-c000-000000000008', 1, 'General admission', null,                               2500,  220),
  ('00000000-0000-4000-c000-000000000008', 2, 'Front tables',      'Closest to the stage',             4500,   30),
  -- The Last Lighthouse @ Grand Oak Theater (800)
  ('00000000-0000-4000-c000-000000000009', 1, 'Balcony',           null,                               5000,  300),
  ('00000000-0000-4000-c000-000000000009', 2, 'Orchestra',         'Main floor',                       8500,  450),
  ('00000000-0000-4000-c000-000000000009', 3, 'Box seats',         'Private boxes of four',           14000,   50),
  -- A Winter's Tale @ Grand Oak Theater (800)
  ('00000000-0000-4000-c000-000000000010', 1, 'Balcony',           null,                               6000,  300),
  ('00000000-0000-4000-c000-000000000010', 2, 'Orchestra',         'Main floor',                       9500,  450),
  ('00000000-0000-4000-c000-000000000010', 3, 'Box seats',         'Private boxes of four',           15000,   50);

-- One ticket per spot in each demo section, at the section's price.
insert into public.tickets (event_id, section_id, number, price_cents)
select s.event_id, s.id, n, s.price_cents
from public.ticket_sections s
join public.events e on e.id = s.event_id
cross join lateral generate_series(1, s.capacity) as n
where e.organizer_id in (
  '00000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000002',
  '00000000-0000-4000-a000-000000000003'
);

-- A few tickets already bought by the demo fans, some listed for resale,
-- so the resale flow has something to show.
update public.tickets t
set owner_id = d.owner_id,
    status = d.status::public.ticket_status,
    list_price_cents = d.list_price_cents
from (values
  -- Jordan: 3 Premium at Neon Tides (one listed), 1 Orchestra at The Last Lighthouse
  ('00000000-0000-4000-c000-000000000001'::uuid, 'Premium',           1, '00000000-0000-4000-a000-000000000011'::uuid, 'sold',   null::int),
  ('00000000-0000-4000-c000-000000000001',       'Premium',           2, '00000000-0000-4000-a000-000000000011',       'sold',   null),
  ('00000000-0000-4000-c000-000000000001',       'Premium',           3, '00000000-0000-4000-a000-000000000011',       'listed', 11000),
  ('00000000-0000-4000-c000-000000000009',       'Orchestra',         1, '00000000-0000-4000-a000-000000000011',       'sold',   null),
  -- Sam: 2 at Midnight Static (one listed), 1 listed Orchestra at The Last Lighthouse
  ('00000000-0000-4000-c000-000000000002',       'General admission', 1, '00000000-0000-4000-a000-000000000012',       'sold',   null),
  ('00000000-0000-4000-c000-000000000002',       'General admission', 2, '00000000-0000-4000-a000-000000000012',       'listed', 6000),
  ('00000000-0000-4000-c000-000000000009',       'Orchestra',         2, '00000000-0000-4000-a000-000000000012',       'listed', 9500)
) as d(event_id, section_name, number, owner_id, status, list_price_cents),
  public.ticket_sections s
where s.event_id = d.event_id
  and s.name = d.section_name
  and t.section_id = s.id
  and t.number = d.number
  and t.status = 'available';

-- Record those tickets as purchases from the event.
insert into public.ticket_transactions (ticket_id, from_user, to_user, price_cents, kind)
select t.id, null::uuid, t.owner_id, t.price_cents, 'purchase'::public.transaction_kind
from public.tickets t
where t.owner_id in ('00000000-0000-4000-a000-000000000011', '00000000-0000-4000-a000-000000000012')
  and not exists (select 1 from public.ticket_transactions tt where tt.ticket_id = t.id);
