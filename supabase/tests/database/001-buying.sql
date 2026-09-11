begin;
select plan(13);

select tests.create_user('organizer', 'organizer');
select tests.create_user('fan');
select tests.create_user('other_fan');
select tests.create_event('Test Show', 'organizer', p_capacity => 3);
select tests.add_section('Test Show', 'Premium', 2, 9000);
select tests.create_event('Past Show', 'organizer', p_capacity => 1, p_starts_at => now() - interval '1 hour');

-- Signed-out visitors
select tests.clear_authentication();

select throws_ok(
  $$ select public.buy_tickets(tests.section_id('Test Show'), 1) $$,
  '42501', 'permission denied for function buy_tickets',
  'signed-out visitors cannot buy tickets'
);

-- Buying a quantity from a section
select tests.authenticate_as('fan');

select lives_ok(
  $$ select public.buy_tickets(tests.section_id('Test Show'), 2) $$,
  'a fan can buy several tickets from a section'
);

select is(
  (select count(*) from public.tickets
   where section_id = tests.section_id('Test Show')
     and owner_id = tests.user_id('fan')
     and status = 'sold'),
  2::bigint,
  'the fan now owns exactly that many tickets'
);

select is(
  (select count(*) from public.ticket_transactions
   where to_user = tests.user_id('fan')
     and kind = 'purchase'
     and from_user is null
     and price_cents = 5000),
  2::bigint,
  'each ticket is recorded as a purchase at the section price'
);

select is(
  (select count(*) from public.tickets
   where section_id = tests.section_id('Test Show', 'Premium') and status = 'available'),
  2::bigint,
  'other sections are not affected'
);

select throws_ok(
  $$ select public.buy_tickets(tests.section_id('Test Show', 'Premium'), 0) $$,
  'P0001', 'You can buy between 1 and 8 tickets at a time',
  'the quantity must be at least 1'
);

select throws_ok(
  $$ select public.buy_tickets(tests.section_id('Test Show', 'Premium'), 9) $$,
  'P0001', 'You can buy between 1 and 8 tickets at a time',
  'no more than 8 tickets per purchase'
);

-- Running out
select tests.authenticate_as('other_fan');

select throws_ok(
  $$ select public.buy_tickets(tests.section_id('Test Show'), 2) $$,
  'P0001', 'Only 1 left in this section',
  'asking for more tickets than are left fails'
);

select is(
  (select count(*) from public.tickets where owner_id = tests.user_id('other_fan')),
  0::bigint,
  'a failed purchase buys nothing (all or nothing)'
);

select lives_ok(
  $$ select public.buy_tickets(tests.section_id('Test Show'), 1) $$,
  'the last ticket can still be bought'
);

select throws_ok(
  $$ select public.buy_tickets(tests.section_id('Test Show'), 1) $$,
  'P0001', 'This section is sold out',
  'a sold-out section says so'
);

-- Other failures
select throws_ok(
  $$ select public.buy_tickets(tests.section_id('Past Show'), 1) $$,
  'P0001', 'This event has already started',
  'tickets cannot be bought once the event has started'
);

select throws_ok(
  $$ select public.buy_tickets(gen_random_uuid(), 1) $$,
  'P0001', 'Section not found',
  'buying from a section that does not exist fails cleanly'
);

select * from finish();
rollback;
