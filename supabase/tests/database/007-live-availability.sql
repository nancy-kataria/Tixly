begin;
select plan(8);

select tests.create_user('organizer', 'organizer');
select tests.create_user('fan');
select tests.create_event('Test Show', 'organizer', p_capacity => 3);
select tests.add_section('Test Show', 'Premium', 2, 9000);

select has_function(
  'public', 'event_availability', array['uuid'],
  'event_availability() exists'
);

select trigger_is(
  'public', 'tickets', 'tickets_broadcast_availability',
  'public', 'broadcast_ticket_changes',
  'ticket changes trigger an availability broadcast'
);

-- Anyone can read an event's availability, like the event page does
select tests.clear_authentication();

select is(
  jsonb_array_length(public.event_availability((select id from public.events where name = 'Test Show')) -> 'sections'),
  2,
  'the snapshot lists every section'
);

select is(
  (public.event_availability((select id from public.events where name = 'Test Show')) -> 'sections' -> 0 ->> 'available_count')::int,
  3,
  'and how many tickets each has left'
);

select ok(
  public.event_availability((select id from public.events where name = 'Test Show')) ->> 'next_hold_expires_at' is null,
  'with nothing in carts, there is no hold to wait for'
);

select tests.authenticate_as('fan');
select public.hold_tickets(tests.section_id('Test Show'), 2);

select is(
  (public.event_availability((select id from public.events where name = 'Test Show')) -> 'sections' -> 0 ->> 'available_count')::int,
  1,
  'tickets added to a cart are subtracted right away'
);

select ok(
  (public.event_availability((select id from public.events where name = 'Test Show')) ->> 'next_hold_expires_at')::timestamptz > now(),
  'the snapshot says when the next hold runs out'
);

-- This test database has no Realtime server: broadcasting must not get in
-- the way of changing tickets.
select lives_ok(
  $$ select public.release_ticket(tests.ticket_id('Test Show', 1)) $$,
  'ticket changes succeed even when Realtime is unavailable'
);

select * from finish();
rollback;
