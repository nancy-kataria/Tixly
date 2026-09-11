begin;
select plan(9);

select tests.create_user('organizer', 'organizer');
select tests.create_user('fan');
select tests.create_user('other_fan');
select tests.create_event('Test Show', 'organizer', p_seats => 2);
select tests.create_event('Past Show', 'organizer', p_seats => 1, p_starts_at => now() - interval '1 hour');

-- Signed-out visitors
select tests.clear_authentication();

select throws_ok(
  $$ select public.buy_ticket(tests.ticket_id('Test Show', 1)) $$,
  '42501', 'permission denied for function buy_ticket',
  'signed-out visitors cannot buy tickets'
);

-- Buying an unsold seat
select tests.authenticate_as('fan');

select lives_ok(
  $$ select public.buy_ticket(tests.ticket_id('Test Show', 1)) $$,
  'a fan can buy an unsold seat'
);

select ok(
  (select status = 'sold' and owner_id = tests.user_id('fan') from tests.ticket('Test Show', 1)),
  'the seat is now sold to that fan'
);

select is(
  (select count(*) from public.ticket_transactions
   where ticket_id = tests.ticket_id('Test Show', 1)
     and kind = 'purchase'
     and from_user is null
     and to_user = tests.user_id('fan')
     and price_cents = 5000),
  1::bigint,
  'the purchase is recorded at face value'
);

-- A seat can only be sold once
select tests.authenticate_as('other_fan');

select throws_ok(
  $$ select public.buy_ticket(tests.ticket_id('Test Show', 1)) $$,
  'P0001', 'This ticket is not for sale',
  'a sold seat cannot be bought again'
);

select ok(
  (select owner_id = tests.user_id('fan') from tests.ticket('Test Show', 1)),
  'the first buyer still owns the seat'
);

select lives_ok(
  $$ select public.buy_ticket(tests.ticket_id('Test Show', 2)) $$,
  'another fan can still buy a different seat'
);

-- Other failures
select throws_ok(
  $$ select public.buy_ticket(tests.ticket_id('Past Show', 1)) $$,
  'P0001', 'This event has already started',
  'tickets cannot be bought once the event has started'
);

select throws_ok(
  $$ select public.buy_ticket(gen_random_uuid()) $$,
  'P0001', 'Ticket not found',
  'buying a ticket that does not exist fails cleanly'
);

select * from finish();
rollback;
