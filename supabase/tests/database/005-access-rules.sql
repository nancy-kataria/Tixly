begin;
select plan(13);

select tests.create_user('organizer', 'organizer');
select tests.create_user('fan_a');
select tests.create_user('fan_b');
select tests.create_event('Test Show', 'organizer', p_seats => 2);

select tests.authenticate_as('fan_a');
select public.buy_ticket(tests.ticket_id('Test Show', 1));
select tests.authenticate_as('fan_b');
select public.buy_ticket(tests.ticket_id('Test Show', 2));

-- What a signed-in fan can see
select tests.authenticate_as('fan_a');

select is(
  (select count(*) from public.ticket_transactions),
  1::bigint,
  'fans see only their own transactions'
);

select is(
  (select count(*) from public.profiles where id = tests.user_id('fan_a')),
  1::bigint,
  'fans can see their own profile'
);

select is(
  (select count(*) from public.profiles where id = tests.user_id('organizer')),
  1::bigint,
  'organizer profiles are visible'
);

select is(
  (select count(*) from public.profiles where id = tests.user_id('fan_b')),
  0::bigint,
  'other fans'' profiles are hidden'
);

-- Tickets only change through the ticket functions
with updated as (
  update public.tickets
  set owner_id = tests.user_id('fan_a')
  where id = tests.ticket_id('Test Show', 2)
  returning 1
)
select is(count(*), 0::bigint, 'tickets cannot be edited directly')
from updated;

select ok(
  (select owner_id = tests.user_id('fan_b') from tests.ticket('Test Show', 2)),
  'the ticket still belongs to its owner'
);

select throws_ok(
  $$ insert into public.ticket_transactions (ticket_id, to_user, price_cents, kind)
     values (tests.ticket_id('Test Show', 2), tests.user_id('fan_a'), 100, 'purchase') $$,
  '42501', 'new row violates row-level security policy for table "ticket_transactions"',
  'transactions cannot be written directly'
);

-- What a signed-out visitor can see
select tests.clear_authentication();

select is(
  (select count(*) from public.ticket_transactions),
  0::bigint,
  'signed-out visitors see no transactions'
);

select is(
  (select count(*) from public.tickets where event_id = (select id from public.events where name = 'Test Show')),
  2::bigint,
  'anyone can see seat availability'
);

-- Table constraints hold even for direct writes that skip the access rules
reset role;

select throws_like(
  $$ update public.tickets set status = 'available' where id = tests.ticket_id('Test Show', 1) $$,
  '%tickets_owner_matches_status%',
  'a ticket cannot be unsold while it has an owner'
);

select throws_like(
  $$ update public.tickets set status = 'listed' where id = tests.ticket_id('Test Show', 1) $$,
  '%tickets_list_price_matches_status%',
  'a ticket cannot be listed without a price'
);

select throws_like(
  $$ insert into public.tickets (event_id, seat_number, price_cents)
     select event_id, 1, 100 from public.tickets where id = tests.ticket_id('Test Show', 1) $$,
  '%duplicate key%',
  'an event cannot have two tickets for the same seat'
);

select throws_like(
  $$ insert into public.ticket_transactions (ticket_id, from_user, to_user, price_cents, kind)
     values (tests.ticket_id('Test Show', 1), tests.user_id('fan_a'), tests.user_id('fan_b'), 100, 'transfer') $$,
  '%ticket_transactions_price_matches_kind%',
  'transfers cannot have a price'
);

select * from finish();
rollback;
