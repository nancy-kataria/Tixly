begin;
select plan(17);

select tests.create_user('organizer', 'organizer');
select tests.create_user('fan');
select tests.create_user('other_fan');
select tests.create_event('Test Show', 'organizer', p_capacity => 3);
select tests.add_section('Test Show', 'Premium', 2, 9000);

-- Checking out
select tests.authenticate_as('fan');

select throws_ok(
  $$ select * from public.create_order() $$,
  'P0001', 'Your cart is empty',
  'checking out an empty cart fails'
);

select public.hold_tickets(tests.section_id('Test Show'), 2);
select public.hold_tickets(tests.section_id('Test Show', 'Premium'), 1);

select lives_ok(
  $$ select * from public.create_order() $$,
  'checking out turns the cart into an order'
);

select is(
  (select total_cents from public.orders where id = tests.pending_order('fan')),
  19000,
  'the order total is the sum of the ticket prices'
);

select is(
  (select count(*) from public.order_items where order_id = tests.pending_order('fan')),
  3::bigint,
  'the order lists every ticket in the cart'
);

select ok(
  (select min(held_until) > now() + interval '30 minutes'
   from public.tickets where held_by = tests.user_id('fan')),
  'the tickets stay held while the payment page is open'
);

select throws_ok(
  $$ select public.complete_order(tests.pending_order('fan'), null, null, 19000) $$,
  '42501', 'permission denied for function complete_order',
  'fans cannot mark their own order as paid'
);

select throws_ok(
  $$ insert into public.orders (buyer_id, total_cents, expires_at)
     values (tests.user_id('fan'), 0, now()) $$,
  '42501', 'new row violates row-level security policy for table "orders"',
  'orders cannot be created directly'
);

select * from public.create_order();

select is(
  (select count(*) from public.orders where status = 'cancelled'),
  1::bigint,
  'checking out again cancels the earlier unpaid order'
);

-- Payment, as the Stripe webhook does it (server only)
reset role;
update public.orders set stripe_session_id = 'cs_test_1' where id = tests.pending_order('fan');

select is(
  public.complete_order(tests.pending_order('fan'), 'cs_test_1', 'pi_test_1', 19000),
  'paid',
  'a confirmed payment completes the order'
);

select is(
  (select count(*) from public.tickets
   where owner_id = tests.user_id('fan') and status = 'sold' and held_by is null),
  3::bigint,
  'the buyer now owns the tickets, and they are out of the cart'
);

select is(
  (select count(*) from public.ticket_transactions tt
   join public.orders o on o.id = tt.order_id
   where o.buyer_id = tests.user_id('fan') and tt.kind = 'purchase'),
  3::bigint,
  'each ticket is recorded as a purchase linked to the order'
);

select is(
  public.complete_order(
    (select id from public.orders where buyer_id = tests.user_id('fan') and status = 'paid'),
    'cs_test_1', 'pi_test_1', 19000
  ),
  'already_paid',
  'the same payment arriving twice is only processed once'
);

select is(
  (select count(*) from public.ticket_transactions tt
   join public.orders o on o.id = tt.order_id
   where o.buyer_id = tests.user_id('fan')),
  3::bigint,
  'the repeat creates no duplicate history'
);

-- A ticket that went to someone else means a refund
select tests.authenticate_as('other_fan');
select public.hold_tickets(tests.section_id('Test Show', 'Premium'), 1);
select * from public.create_order();
reset role;
update public.orders set stripe_session_id = 'cs_test_2' where id = tests.pending_order('other_fan');
update public.tickets
set owner_id = tests.user_id('fan'), status = 'sold', held_by = null, held_until = null
where id = tests.ticket_id('Test Show', 2, 'Premium');

select is(
  public.complete_order(tests.pending_order('other_fan'), 'cs_test_2', 'pi_test_2', 9000),
  'refund_needed',
  'if a ticket is no longer available, the payment is refunded instead'
);

select is(
  (select status::text from public.orders where stripe_session_id = 'cs_test_2'),
  'refunded',
  'the order is marked refunded'
);

-- An abandoned payment page puts the tickets back on sale
select tests.authenticate_as('other_fan');
select public.hold_tickets(tests.section_id('Test Show'), 1);
select * from public.create_order();
reset role;
select public.expire_order(tests.pending_order('other_fan'));

select is(
  (select count(*) from public.orders
   where buyer_id = tests.user_id('other_fan') and status = 'expired'),
  1::bigint,
  'an expired payment page expires the order'
);

select ok(
  (select held_by is null and status = 'available' from tests.ticket('Test Show', 3)),
  'and its tickets are back on sale'
);

select * from finish();
rollback;
