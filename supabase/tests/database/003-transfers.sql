begin;
select plan(9);

select tests.create_user('organizer', 'organizer');
select tests.create_user('sender');
select tests.create_user('recipient');
select tests.create_event('Test Show', 'organizer', p_seats => 3);

-- The sender owns seats 1 and 2, and seat 2 is listed for resale.
select tests.authenticate_as('sender');
select public.buy_ticket(tests.ticket_id('Test Show', 1));
select public.buy_ticket(tests.ticket_id('Test Show', 2));
select public.list_ticket(tests.ticket_id('Test Show', 2), 6000);

select lives_ok(
  $$ select public.transfer_ticket(tests.ticket_id('Test Show', 1), 'RECIPIENT@test.local') $$,
  'the owner can transfer a ticket by email (case-insensitive)'
);

select ok(
  (select owner_id = tests.user_id('recipient') and status = 'sold' from tests.ticket('Test Show', 1)),
  'the ticket now belongs to the recipient'
);

select is(
  (select count(*) from public.ticket_transactions
   where ticket_id = tests.ticket_id('Test Show', 1)
     and kind = 'transfer'
     and from_user = tests.user_id('sender')
     and to_user = tests.user_id('recipient')
     and price_cents is null),
  1::bigint,
  'the transfer is recorded, with no price'
);

select throws_ok(
  $$ select public.transfer_ticket(tests.ticket_id('Test Show', 1), 'recipient@test.local') $$,
  'P0001', 'You can only transfer tickets you own',
  'a ticket cannot be transferred after giving it away'
);

select lives_ok(
  $$ select public.transfer_ticket(tests.ticket_id('Test Show', 2), 'recipient@test.local') $$,
  'a listed ticket can be transferred'
);

select ok(
  (select owner_id = tests.user_id('recipient') and status = 'sold' and list_price_cents is null
   from tests.ticket('Test Show', 2)),
  'transferring a listed ticket cancels the listing'
);

select throws_ok(
  $$ select public.transfer_ticket(tests.ticket_id('Test Show', 3), 'nobody@test.local') $$,
  'P0001', 'No Tixly user has that email',
  'transfers to an unknown email are rejected'
);

select tests.authenticate_as('recipient');

select throws_ok(
  $$ select public.transfer_ticket(tests.ticket_id('Test Show', 1), 'recipient@test.local') $$,
  'P0001', 'You can''t transfer a ticket to yourself',
  'users cannot transfer a ticket to themselves'
);

select tests.clear_authentication();

select throws_ok(
  $$ select public.transfer_ticket(tests.ticket_id('Test Show', 1), 'sender@test.local') $$,
  '42501', 'permission denied for function transfer_ticket',
  'signed-out visitors cannot transfer tickets'
);

select * from finish();
rollback;
