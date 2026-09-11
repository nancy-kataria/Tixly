begin;
select plan(19);

select tests.create_user('organizer', 'organizer');
select tests.create_user('fan');
select tests.create_venue('Test Venue', 25);

-- Creating events
select tests.authenticate_as('fan');

select throws_ok(
  $$ select public.create_event('Fan Night', null, 'music', now() + interval '7 days', tests.venue_id('Test Venue'),
       '[{"name": "General", "price_cents": 2000, "capacity": 10}]') $$,
  'P0001', 'Only organizers can create events',
  'regular users cannot create events'
);

select tests.authenticate_as('organizer');

select lives_ok(
  $$ select public.create_event('Big Night', 'The Band', 'music', now() + interval '10 days', tests.venue_id('Test Venue'),
       '[{"name": "General", "price_cents": 4000, "capacity": 20},
         {"name": "Premium", "description": "Center", "price_cents": 9000, "capacity": 5}]') $$,
  'an organizer can create an event with several sections'
);

select is(
  (select count(*) from public.tickets
   where section_id = tests.section_id('Big Night', 'General') and status = 'available' and price_cents = 4000),
  20::bigint,
  'each section gets its own unsold tickets at its price'
);

select is(
  (select count(*) from public.tickets
   where section_id = tests.section_id('Big Night', 'Premium') and status = 'available' and price_cents = 9000),
  5::bigint,
  'including the second section'
);

select is(
  (select string_agg(s.name, ', ' order by s.sort_order)
   from public.ticket_sections s
   join public.events e on e.id = s.event_id
   where e.name = 'Big Night'),
  'General, Premium',
  'sections keep the order the organizer gave them'
);

select ok(
  (select organizer_id = tests.user_id('organizer') from public.events where name = 'Big Night'),
  'the event belongs to the organizer who created it'
);

select throws_ok(
  $$ select public.create_event('Old Night', null, 'music', now() - interval '1 day', tests.venue_id('Test Venue'),
       '[{"name": "General", "price_cents": 4000, "capacity": 20}]') $$,
  'P0001', 'The event date must be in the future',
  'events cannot be created in the past'
);

select throws_ok(
  $$ select public.create_event('Packed Night', null, 'music', now() + interval '10 days', tests.venue_id('Test Venue'),
       '[{"name": "General", "price_cents": 4000, "capacity": 20},
         {"name": "Premium", "price_cents": 9000, "capacity": 10}]') $$,
  'P0001', 'Sections add up to 30 tickets, but the venue holds 25',
  'sections cannot hold more people than the venue'
);

select throws_ok(
  $$ select public.create_event('Cheap Night', null, 'music', now() + interval '10 days', tests.venue_id('Test Venue'),
       '[{"name": "General", "price_cents": -100, "capacity": 20}]') $$,
  'P0001', 'Each section needs a name, a price of zero or more, and at least one ticket',
  'section prices cannot be negative'
);

select throws_ok(
  $$ select public.create_event('Twin Night', null, 'music', now() + interval '10 days', tests.venue_id('Test Venue'),
       '[{"name": "General", "price_cents": 4000, "capacity": 10},
         {"name": "general", "price_cents": 5000, "capacity": 10}]') $$,
  'P0001', 'Section names must be different',
  'two sections cannot share a name'
);

select throws_ok(
  $$ select public.create_event('Empty Night', null, 'music', now() + interval '10 days', tests.venue_id('Test Venue'), '[]') $$,
  'P0001', 'An event needs between 1 and 10 sections',
  'an event needs at least one section'
);

-- Roles: users can edit their name, but only become_organizer() changes the role
select tests.authenticate_as('fan');

select throws_ok(
  $$ update public.profiles set role = 'organizer' where id = tests.user_id('fan') $$,
  '42501', 'permission denied for table profiles',
  'users cannot change their own role directly'
);

select lives_ok(
  $$ update public.profiles set name = 'New Name' where id = tests.user_id('fan') $$,
  'users can change their own name'
);

select is(
  (select name from public.profiles where id = tests.user_id('fan')),
  'New Name',
  'the new name is saved'
);

select throws_ok(
  $$ insert into public.venues (name, address, capacity, created_by)
     values ('Fan Venue', '2 Test St', 10, tests.user_id('fan')) $$,
  '42501', 'new row violates row-level security policy for table "venues"',
  'regular users cannot add venues'
);

select lives_ok(
  $$ select public.become_organizer() $$,
  'a user can become an organizer'
);

select is(
  (select role::text from public.profiles where id = tests.user_id('fan')),
  'organizer',
  'their role is now organizer'
);

select lives_ok(
  $$ insert into public.venues (name, address, capacity, created_by)
     values ('Fan Venue', '2 Test St', 10, tests.user_id('fan')) $$,
  'new organizers can add venues'
);

select tests.clear_authentication();

select throws_ok(
  $$ select public.become_organizer() $$,
  '42501', 'permission denied for function become_organizer',
  'signed-out visitors cannot become organizers'
);

select * from finish();
rollback;
