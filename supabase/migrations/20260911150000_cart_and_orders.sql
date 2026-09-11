-- Carts, orders and card payments (Stripe, test mode).
--
-- Buying is now two steps:
--   1. Adding tickets to your cart holds them for 10 minutes, so nobody
--      else can take them while you check out.
--   2. Checkout turns the cart into an order and opens a Stripe payment
--      page. When Stripe confirms the payment (webhook), complete_order()
--      hands the tickets over. If the page expires unpaid, expire_order()
--      gives them back.
--
-- Holds end on their own: a ticket only counts as held while held_until is
-- in the future, so no background job is needed to release them.


-- Holds ------------------------------------------------------------------------

alter table public.tickets
  add column held_by uuid references public.profiles (id),
  add column held_until timestamptz,
  add constraint tickets_hold_complete
    check ((held_by is null) = (held_until is null)),
  -- Only tickets that are for sale can sit in a cart.
  add constraint tickets_hold_only_for_sale
    check (held_by is null or status in ('available', 'listed'));

create index tickets_held_by_idx on public.tickets (held_by) where held_by is not null;


-- Orders -----------------------------------------------------------------------

create type public.order_status as enum ('pending', 'paid', 'expired', 'cancelled', 'refunded');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id),
  status public.order_status not null default 'pending',
  total_cents int not null check (total_cents >= 0),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  -- If the order isn't paid by now, its tickets are released.
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index orders_buyer_id_idx on public.orders (buyer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  ticket_id uuid not null references public.tickets (id),
  seller_id uuid references public.profiles (id), -- null: bought from the event
  price_cents int not null check (price_cents >= 0),

  unique (order_id, ticket_id)
);

create index order_items_ticket_id_idx on public.order_items (ticket_id);

alter table public.ticket_transactions
  add column order_id uuid references public.orders (id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Orders are created and changed only through the functions below.
create policy "Buyers see their own orders"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = buyer_id);

create policy "Buyers see their own order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = (select auth.uid())
    )
  );


-- Views: tickets in someone's cart aren't available -------------------------------

create or replace view public.section_availability
with (security_invoker = true)
as
select
  s.id,
  s.event_id,
  s.name,
  s.description,
  s.price_cents,
  s.capacity,
  s.sort_order,
  count(t.id) filter (
    where t.status = 'available' and (t.held_until is null or t.held_until <= now())
  ) as available_count,
  count(t.id) filter (
    where t.status = 'listed' and (t.held_until is null or t.held_until <= now())
  ) as resale_count,
  min(t.list_price_cents) filter (
    where t.status = 'listed' and (t.held_until is null or t.held_until <= now())
  ) as resale_from_cents
from public.ticket_sections s
left join public.tickets t on t.section_id = s.id
group by s.id;

create or replace view public.event_summaries
with (security_invoker = true)
as
select
  e.id,
  e.organizer_id,
  e.name,
  e.artist,
  e.category,
  e.starts_at,
  e.image_url,
  v.name as venue_name,
  v.address as venue_address,
  count(t.id) filter (
    where t.status = 'available' and (t.held_until is null or t.held_until <= now())
  ) as available_count,
  count(t.id) filter (
    where t.status = 'listed' and (t.held_until is null or t.held_until <= now())
  ) as resale_count,
  count(t.id) filter (where t.status <> 'available') as sold_count,
  -- least() ignores nulls, so this is the cheaper of the two when both exist.
  least(
    min(t.price_cents) filter (
      where t.status = 'available' and (t.held_until is null or t.held_until <= now())
    ),
    min(t.list_price_cents) filter (
      where t.status = 'listed' and (t.held_until is null or t.held_until <= now())
    )
  ) as from_price_cents
from public.events e
join public.venues v on v.id = e.venue_id
left join public.tickets t on t.event_id = e.id
group by e.id, v.id;


-- Cart functions ---------------------------------------------------------------

-- Buying without paying is no longer possible.
drop function public.buy_tickets(uuid, int);
drop function public.buy_resale_ticket(uuid);

-- Holds p_quantity unsold tickets from a section in your cart. Returns when
-- the cart expires. Everything in a cart shares one timer, started by the
-- first ticket added.
create function public.hold_tickets(p_section_id uuid, p_quantity int)
returns timestamptz
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_starts_at timestamptz;
  v_in_cart int;
  v_cart_expires_at timestamptz;
  v_ticket_ids uuid[];
  v_found int;
begin
  if v_user is null then
    raise exception 'You must be signed in to buy tickets';
  end if;

  if p_quantity is null or p_quantity not between 1 and 8 then
    raise exception 'You can add between 1 and 8 tickets at a time';
  end if;

  select e.starts_at into v_starts_at
  from public.ticket_sections s
  join public.events e on e.id = s.event_id
  where s.id = p_section_id;

  if not found then
    raise exception 'Section not found';
  end if;

  if v_starts_at <= now() then
    raise exception 'This event has already started';
  end if;

  select count(*), min(held_until) into v_in_cart, v_cart_expires_at
  from public.tickets
  where held_by = v_user and held_until > now();

  if v_in_cart + p_quantity > 8 then
    raise exception 'Your cart can hold up to 8 tickets, and it has %', v_in_cart;
  end if;

  v_cart_expires_at := coalesce(v_cart_expires_at, now() + interval '10 minutes');

  -- FOR UPDATE SKIP LOCKED: tickets another shopper is claiming right now
  -- are skipped rather than waited on, so simultaneous shoppers get
  -- different tickets.
  select array_agg(id) into v_ticket_ids
  from (
    select id
    from public.tickets
    where section_id = p_section_id
      and status = 'available'
      and (held_until is null or held_until <= now())
    order by number
    limit p_quantity
    for update skip locked
  ) as picked;

  v_found := coalesce(array_length(v_ticket_ids, 1), 0);
  if v_found = 0 then
    raise exception 'This section is sold out';
  elsif v_found < p_quantity then
    raise exception 'Only % left in this section', v_found;
  end if;

  update public.tickets
  set held_by = v_user, held_until = v_cart_expires_at
  where id = any (v_ticket_ids);

  return v_cart_expires_at;
end;
$$;

-- Holds a ticket another fan listed for resale in your cart.
create function public.hold_resale_ticket(p_ticket_id uuid)
returns timestamptz
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_ticket public.tickets;
  v_in_cart int;
  v_cart_expires_at timestamptz;
begin
  if v_user is null then
    raise exception 'You must be signed in to buy tickets';
  end if;

  select * into v_ticket from public.tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'Ticket not found';
  end if;

  if (select starts_at from public.events where id = v_ticket.event_id) <= now() then
    raise exception 'This event has already started';
  end if;

  if v_ticket.status <> 'listed' then
    raise exception 'This ticket is not for sale';
  end if;

  if v_ticket.owner_id = v_user then
    raise exception 'You already own this ticket';
  end if;

  if v_ticket.held_until > now() then
    if v_ticket.held_by = v_user then
      return v_ticket.held_until; -- already in your cart
    end if;
    raise exception 'Someone else has this ticket in their cart';
  end if;

  select count(*), min(held_until) into v_in_cart, v_cart_expires_at
  from public.tickets
  where held_by = v_user and held_until > now();

  if v_in_cart + 1 > 8 then
    raise exception 'Your cart can hold up to 8 tickets, and it has %', v_in_cart;
  end if;

  v_cart_expires_at := coalesce(v_cart_expires_at, now() + interval '10 minutes');

  update public.tickets
  set held_by = v_user, held_until = v_cart_expires_at
  where id = p_ticket_id;

  return v_cart_expires_at;
end;
$$;

-- Takes a ticket out of your cart.
create function public.release_ticket(p_ticket_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.tickets
  set held_by = null, held_until = null
  where id = p_ticket_id and held_by = auth.uid();

  if not found then
    raise exception 'That ticket is not in your cart';
  end if;
end;
$$;


-- Checkout and payment ------------------------------------------------------------

-- Turns your cart into an order to pay for. Checking out again replaces an
-- earlier unpaid order. The tickets stay held for 35 minutes, because
-- Stripe's payment page stays open for at least 30.
create function public.create_order()
returns table (order_id uuid, total_cents int, expires_at timestamptz)
language plpgsql
security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user uuid := auth.uid();
  v_order_id uuid;
  v_total int;
  v_count int;
  v_expires_at timestamptz := now() + interval '35 minutes';
begin
  if v_user is null then
    raise exception 'You must be signed in to check out';
  end if;

  update public.orders
  set status = 'cancelled'
  where buyer_id = v_user and status = 'pending';

  -- Lock the cart so it can't change while the order is created.
  perform 1 from public.tickets
  where held_by = v_user and held_until > now()
  for update;

  select
    count(*),
    coalesce(sum(case when t.status = 'listed' then t.list_price_cents else t.price_cents end), 0)
  into v_count, v_total
  from public.tickets t
  where t.held_by = v_user and t.held_until > now();

  if v_count = 0 then
    raise exception 'Your cart is empty';
  end if;

  insert into public.orders (buyer_id, total_cents, expires_at)
  values (v_user, v_total, v_expires_at)
  returning id into v_order_id;

  insert into public.order_items (order_id, ticket_id, seller_id, price_cents)
  select
    v_order_id,
    t.id,
    case when t.status = 'listed' then t.owner_id end,
    case when t.status = 'listed' then t.list_price_cents else t.price_cents end
  from public.tickets t
  where t.held_by = v_user and t.held_until > now();

  update public.tickets t
  set held_until = v_expires_at
  where t.held_by = v_user and t.held_until > now();

  return query select v_order_id, v_total, v_expires_at;
end;
$$;

-- Called by the Stripe webhook (server only) once a payment succeeds.
-- Hands every ticket in the order to the buyer, all or nothing, and is safe
-- to call again for the same payment. Returns:
--   'paid'           the tickets were handed over
--   'already_paid'   this payment was processed before
--   'refund_needed'  the order can't be fulfilled (it was replaced or
--                    expired, a ticket went to someone else, or the amount
--                    doesn't match), so the caller must refund the payment
create function public.complete_order(
  p_order_id uuid,
  p_session_id text,
  p_payment_intent_id text,
  p_amount_total int
)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_order public.orders;
  v_unavailable int;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status = 'paid' then
    return 'already_paid';
  end if;
  if v_order.status = 'refunded' then
    return 'refund_needed';
  end if;

  if v_order.stripe_session_id is distinct from p_session_id then
    raise exception 'This payment belongs to a different checkout';
  end if;

  perform 1
  from public.tickets t
  join public.order_items i on i.ticket_id = t.id
  where i.order_id = p_order_id
  for update of t;

  -- Each ticket must still be for sale by the same seller at the same
  -- price, and not held by anyone else.
  select count(*) into v_unavailable
  from public.order_items i
  join public.tickets t on t.id = i.ticket_id
  where i.order_id = p_order_id
    and not (
      (
        case
          when i.seller_id is null then t.status = 'available' and t.price_cents = i.price_cents
          else t.status = 'listed' and t.owner_id = i.seller_id and t.list_price_cents = i.price_cents
        end
      )
      and (t.held_by = v_order.buyer_id or t.held_until is null or t.held_until <= now())
    );

  if v_order.status <> 'pending' or v_unavailable > 0 or p_amount_total <> v_order.total_cents then
    update public.orders
    set status = 'refunded', stripe_payment_intent_id = p_payment_intent_id
    where id = p_order_id;

    -- Let go of any of these tickets the buyer still holds.
    update public.tickets t
    set held_by = null, held_until = null
    from public.order_items i
    where i.order_id = p_order_id and t.id = i.ticket_id and t.held_by = v_order.buyer_id;

    return 'refund_needed';
  end if;

  update public.tickets t
  set owner_id = v_order.buyer_id, status = 'sold', list_price_cents = null,
      held_by = null, held_until = null
  from public.order_items i
  where i.order_id = p_order_id and t.id = i.ticket_id;

  insert into public.ticket_transactions (ticket_id, from_user, to_user, price_cents, kind, order_id)
  select
    i.ticket_id,
    i.seller_id,
    v_order.buyer_id,
    i.price_cents,
    (case when i.seller_id is null then 'purchase' else 'resale' end)::public.transaction_kind,
    p_order_id
  from public.order_items i
  where i.order_id = p_order_id;

  update public.orders
  set status = 'paid', paid_at = now(), stripe_payment_intent_id = p_payment_intent_id
  where id = p_order_id;

  return 'paid';
end;
$$;

-- Called by the Stripe webhook (server only) when a payment page expires
-- unpaid: puts the order's tickets back on sale.
create function public.expire_order(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_buyer uuid;
begin
  update public.orders
  set status = 'expired'
  where id = p_order_id and status = 'pending'
  returning buyer_id into v_buyer;

  if not found then
    return; -- already paid, replaced or refunded
  end if;

  update public.tickets t
  set held_by = null, held_until = null
  from public.order_items i
  where i.order_id = p_order_id and t.id = i.ticket_id and t.held_by = v_buyer;
end;
$$;


-- Sellers can't pull a ticket out from under someone checking out -----------------

create or replace function public.unlist_ticket(p_ticket_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_ticket public.tickets;
begin
  select * into v_ticket
  from public.tickets
  where id = p_ticket_id and owner_id = auth.uid() and status = 'listed'
  for update;

  if not found then
    raise exception 'You can only cancel listings for your own tickets';
  end if;

  if v_ticket.held_until > now() then
    raise exception 'Someone is buying this ticket right now. Try again in a few minutes';
  end if;

  update public.tickets
  set status = 'sold', list_price_cents = null, held_by = null, held_until = null
  where id = p_ticket_id;
end;
$$;

create or replace function public.transfer_ticket(p_ticket_id uuid, p_recipient_email text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_sender uuid := auth.uid();
  v_recipient uuid;
  v_ticket public.tickets;
begin
  if v_sender is null then
    raise exception 'You must be signed in to transfer tickets';
  end if;

  select id into v_recipient
  from auth.users
  where lower(email) = lower(trim(p_recipient_email));

  if v_recipient is null then
    raise exception 'No Tixly user has that email';
  end if;

  if v_recipient = v_sender then
    raise exception 'You can''t transfer a ticket to yourself';
  end if;

  select * into v_ticket
  from public.tickets
  where id = p_ticket_id and owner_id = v_sender and status in ('sold', 'listed')
  for update;

  if not found then
    raise exception 'You can only transfer tickets you own';
  end if;

  if v_ticket.held_until > now() then
    raise exception 'Someone is buying this ticket right now. Try again in a few minutes';
  end if;

  update public.tickets
  set owner_id = v_recipient, status = 'sold', list_price_cents = null,
      held_by = null, held_until = null
  where id = p_ticket_id;

  insert into public.ticket_transactions (ticket_id, from_user, to_user, price_cents, kind)
  values (p_ticket_id, v_sender, v_recipient, null, 'transfer');
end;
$$;


-- Who can call what -------------------------------------------------------------

revoke execute on function public.hold_tickets(uuid, int) from public, anon;
revoke execute on function public.hold_resale_ticket(uuid) from public, anon;
revoke execute on function public.release_ticket(uuid) from public, anon;
revoke execute on function public.create_order() from public, anon;
grant execute on function public.hold_tickets(uuid, int) to authenticated;
grant execute on function public.hold_resale_ticket(uuid) to authenticated;
grant execute on function public.release_ticket(uuid) to authenticated;
grant execute on function public.create_order() to authenticated;

-- Only the server, using the secret key, can confirm or expire payments.
revoke execute on function public.complete_order(uuid, text, text, int) from public, anon, authenticated;
revoke execute on function public.expire_order(uuid) from public, anon, authenticated;
grant execute on function public.complete_order(uuid, text, text, int) to service_role;
grant execute on function public.expire_order(uuid) to service_role;
