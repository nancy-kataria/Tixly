begin;
select plan(14);

select tests.create_user('organizer', 'organizer');
select tests.create_user('fan');
select tests.create_venue('Test Venue', 25);

-- Creating events
select tests.authenticate_as('fan');

select throws_ok(
  $$ select public.create_event('Fan Night', null, 'music', now() + interval '7 days', tests.venue_id('Test Venue'), 2000) $$,
  'P0001', 'Only organizers can create events',
  'regular users cannot create events'
);

select tests.authenticate_as('organizer');

select lives_ok(
  $$ select public.create_event('Big Night', 'The Band', 'music', now() + interval '10 days', tests.venue_id('Test Venue'), 4000) $$,
  'an organizer can create an event'
);

select is(
  (select count(*) from public.tickets t
   join public.events e on e.id = t.event_id
   where e.name = 'Big Night' and t.status = 'available' and t.price_cents = 4000),
  25::bigint,
  'the event gets one unsold ticket per venue seat, at the chosen price'
);

select ok(
  (select organizer_id = tests.user_id('organizer') from public.events where name = 'Big Night'),
  'the event belongs to the organizer who created it'
);

select throws_ok(
  $$ select public.create_event('Old Night', null, 'music', now() - interval '1 day', tests.venue_id('Test Venue'), 4000) $$,
  'P0001', 'The event date must be in the future',
  'events cannot be created in the past'
);

select throws_ok(
  $$ select public.create_event('Cheap Night', null, 'music', now() + interval '10 days', tests.venue_id('Test Venue'), -100) $$,
  'P0001', 'The ticket price must be zero or more',
  'ticket prices cannot be negative'
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
