begin;
select plan(14);

select tests.create_user('organizer', 'organizer');
select tests.create_user('fan');
select tests.create_user('other_fan');
select tests.create_event('Test Show', 'organizer', p_capacity => 3);
select tests.add_section('Test Show', 'Premium', 2, 9000);
select tests.create_event('Big Show', 'organizer', p_capacity => 20);
select tests.create_event('Past Show', 'organizer', p_capacity => 1, p_starts_at => now() - interval '1 hour');

-- Signed-out visitors
select tests.clear_authentication();

select throws_ok(
  $$ select public.hold_tickets(tests.section_id('Test Show'), 1) $$,
  '42501', 'permission denied for function hold_tickets',
  'signed-out visitors cannot add tickets to a cart'
);

-- Adding tickets to a cart
select tests.authenticate_as('fan');

select lives_ok(
  $$ select public.hold_tickets(tests.section_id('Test Show'), 2) $$,
  'a fan can add tickets from a section to their cart'
);

select is(
  (select count(*) from public.tickets
   where section_id = tests.section_id('Test Show')
     and held_by = tests.user_id('fan')
     and held_until > now()
     and status = 'available'
     and owner_id is null),
  2::bigint,
  'the tickets are held for the fan, not sold'
);

select is(
  (select available_count from public.section_availability where id = tests.section_id('Test Show')),
  1::bigint,
  'held tickets no longer show as available'
);

select throws_ok(
  $$ select public.hold_tickets(tests.section_id('Test Show'), 0) $$,
  'P0001', 'You can add between 1 and 8 tickets at a time',
  'the quantity must be at least 1'
);

select lives_ok(
  $$ select public.hold_tickets(tests.section_id('Big Show'), 6) $$,
  'a cart can hold tickets from several events'
);

select throws_ok(
  $$ select public.hold_tickets(tests.section_id('Test Show', 'Premium'), 1) $$,
  'P0001', 'Your cart can hold up to 8 tickets, and it has 8',
  'a cart holds at most 8 tickets'
);

select is(
  (select count(distinct held_until) from public.tickets where held_by = tests.user_id('fan')),
  1::bigint,
  'everything in a cart shares one timer'
);

select lives_ok(
  $$ select public.release_ticket(tests.ticket_id('Big Show', 1)) $$,
  'a fan can take a ticket out of their cart'
);

select is(
  (select count(*) from public.tickets where held_by = tests.user_id('fan')),
  7::bigint,
  'the cart now has one ticket fewer'
);

-- Someone else can't take held tickets
select tests.authenticate_as('other_fan');

select throws_ok(
  $$ select public.hold_tickets(tests.section_id('Test Show'), 2) $$,
  'P0001', 'Only 1 left in this section',
  'tickets in someone else''s cart cannot be taken'
);

-- ...until the fan's timer runs out
reset role;
update public.tickets
set held_until = now() - interval '1 second'
where held_by = tests.user_id('fan') and section_id = tests.section_id('Test Show');
select tests.authenticate_as('other_fan');

select lives_ok(
  $$ select public.hold_tickets(tests.section_id('Test Show'), 2) $$,
  'expired holds free the tickets up, with no cleanup job'
);

-- Other failures
select throws_ok(
  $$ select public.hold_tickets(tests.section_id('Past Show'), 1) $$,
  'P0001', 'This event has already started',
  'tickets cannot be added once the event has started'
);

select throws_ok(
  $$ select public.hold_tickets(gen_random_uuid(), 1) $$,
  'P0001', 'Section not found',
  'adding from a section that does not exist fails cleanly'
);

select * from finish();
rollback;
