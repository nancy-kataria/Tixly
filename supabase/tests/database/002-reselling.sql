begin;
select plan(14);

select tests.create_user('organizer', 'organizer');
select tests.create_user('seller');
select tests.create_user('buyer');
select tests.create_event('Test Show', 'organizer', p_capacity => 2);

-- The seller buys one ticket. Tickets are handed out in number order, so
-- it's #1; #2 stays unsold.
select tests.authenticate_as('seller');
select public.buy_tickets(tests.section_id('Test Show'), 1);

-- Listing
select throws_ok(
  $$ select public.list_ticket(tests.ticket_id('Test Show', 2), 7500) $$,
  'P0001', 'You can only list a ticket you own, for an upcoming event, that isn''t already listed',
  'an unsold ticket cannot be listed for resale'
);

select throws_ok(
  $$ select public.list_ticket(tests.ticket_id('Test Show', 1), 0) $$,
  'P0001', 'The resale price must be more than zero',
  'the resale price must be above zero'
);

select lives_ok(
  $$ select public.list_ticket(tests.ticket_id('Test Show', 1), 7500) $$,
  'the owner can list their ticket'
);

select ok(
  (select status = 'listed' and list_price_cents = 7500 from tests.ticket('Test Show', 1)),
  'the ticket is listed at the chosen price'
);

select throws_ok(
  $$ select public.list_ticket(tests.ticket_id('Test Show', 1), 9000) $$,
  'P0001', 'You can only list a ticket you own, for an upcoming event, that isn''t already listed',
  'a ticket cannot be listed twice'
);

select throws_ok(
  $$ select public.buy_resale_ticket(tests.ticket_id('Test Show', 1)) $$,
  'P0001', 'You already own this ticket',
  'sellers cannot buy their own listing'
);

-- Another user can't touch the listing, only buy it
select tests.authenticate_as('buyer');

select throws_ok(
  $$ select public.list_ticket(tests.ticket_id('Test Show', 1), 9000) $$,
  'P0001', 'You can only list a ticket you own, for an upcoming event, that isn''t already listed',
  'users cannot list someone else''s ticket'
);

select throws_ok(
  $$ select public.unlist_ticket(tests.ticket_id('Test Show', 1)) $$,
  'P0001', 'You can only cancel listings for your own tickets',
  'users cannot cancel someone else''s listing'
);

select throws_ok(
  $$ select public.buy_resale_ticket(tests.ticket_id('Test Show', 2)) $$,
  'P0001', 'This ticket is not for sale',
  'unsold tickets are bought by section, not on resale'
);

select lives_ok(
  $$ select public.buy_resale_ticket(tests.ticket_id('Test Show', 1)) $$,
  'a buyer can buy a listed ticket'
);

select ok(
  (select owner_id = tests.user_id('buyer') and status = 'sold' and list_price_cents is null
   from tests.ticket('Test Show', 1)),
  'the ticket moves to the buyer and is no longer listed'
);

select is(
  (select count(*) from public.ticket_transactions
   where ticket_id = tests.ticket_id('Test Show', 1)
     and kind = 'resale'
     and from_user = tests.user_id('seller')
     and to_user = tests.user_id('buyer')
     and price_cents = 7500),
  1::bigint,
  'the resale is recorded with the seller and the resale price'
);

-- Cancelling a listing
select public.list_ticket(tests.ticket_id('Test Show', 1), 9000);

select lives_ok(
  $$ select public.unlist_ticket(tests.ticket_id('Test Show', 1)) $$,
  'the owner can cancel their listing'
);

select ok(
  (select owner_id = tests.user_id('buyer') and status = 'sold' and list_price_cents is null
   from tests.ticket('Test Show', 1)),
  'after cancelling, the owner keeps the ticket and it is off the market'
);

select * from finish();
rollback;
