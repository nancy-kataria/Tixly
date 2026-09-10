create type public.event_category as enum ('music', 'sports', 'comedy', 'theater');

-- available: unsold, held by the event
-- sold:      owned, not for sale
-- listed:    owned and up for resale at list_price_cents
create type public.ticket_status as enum ('available', 'sold', 'listed');

create type public.transaction_kind as enum ('purchase', 'resale', 'transfer');


-- Venues ---------------------------------------------------------------------

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  address text not null,
  -- The event page renders every seat, so keep venues modest until it
  -- paginates.
  capacity int not null check (capacity between 1 and 1000),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.venues enable row level security;

create policy "Venues are viewable by everyone"
  on public.venues for select
  using (true);

create policy "Organizers can add venues"
  on public.venues for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'organizer'
    )
  );


-- Events ---------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete restrict,
  venue_id uuid not null references public.venues (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  artist text,
  category public.event_category not null default 'music',
  starts_at timestamptz not null,
  image_url text,
  created_at timestamptz not null default now()
);

create index events_organizer_id_idx on public.events (organizer_id);
create index events_venue_id_idx on public.events (venue_id);
create index events_starts_at_idx on public.events (starts_at);

alter table public.events enable row level security;

-- Events are created through create_event(), which also creates the tickets.
create policy "Events are viewable by everyone"
  on public.events for select
  using (true);


-- Tickets --------------------------------------------------------------------

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  seat_number int not null check (seat_number > 0),
  price_cents int not null check (price_cents >= 0), -- face value
  owner_id uuid references public.profiles (id) on delete restrict,
  status public.ticket_status not null default 'available',
  list_price_cents int check (list_price_cents > 0),

  unique (event_id, seat_number),
  -- Unsold tickets have no owner, and every sold or listed ticket has one.
  constraint tickets_owner_matches_status
    check ((status = 'available') = (owner_id is null)),
  -- A resale price exists only while the ticket is listed.
  constraint tickets_list_price_matches_status
    check ((status = 'listed') = (list_price_cents is not null))
);

create index tickets_owner_id_idx on public.tickets (owner_id);

alter table public.tickets enable row level security;

-- Seat availability is public. Changes only happen through the functions
-- below, so there are no insert/update/delete policies.
create policy "Tickets are viewable by everyone"
  on public.tickets for select
  using (true);


-- Ticket transactions ----------------------------------------------------------

-- Append-only history of every change of ticket owner.
create table public.ticket_transactions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id),
  from_user uuid references public.profiles (id), -- null: bought from the event
  to_user uuid not null references public.profiles (id),
  price_cents int check (price_cents >= 0),       -- null for transfers
  kind public.transaction_kind not null,
  created_at timestamptz not null default now(),

  constraint ticket_transactions_price_matches_kind
    check ((kind = 'transfer') = (price_cents is null)),
  constraint ticket_transactions_seller_matches_kind
    check ((kind = 'purchase') = (from_user is null))
);

create index ticket_transactions_ticket_id_idx on public.ticket_transactions (ticket_id);
create index ticket_transactions_from_user_idx on public.ticket_transactions (from_user);
create index ticket_transactions_to_user_idx on public.ticket_transactions (to_user);

alter table public.ticket_transactions enable row level security;

create policy "Users see transactions they're part of"
  on public.ticket_transactions for select
  to authenticated
  using ((select auth.uid()) in (from_user, to_user));


-- Functions ------------------------------------------------------------------
-- Each runs as one database transaction, so a failure part-way leaves
-- nothing half-done.

-- Creates an event with one ticket per venue seat, all at the same price.
create function public.create_event(
  p_name text,
  p_artist text,
  p_category public.event_category,
  p_starts_at timestamptz,
  p_venue_id uuid,
  p_price_cents int,
  p_image_url text default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_event_id uuid;
  v_capacity int;
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'organizer'
  ) then
    raise exception 'Only organizers can create events';
  end if;

  if p_starts_at is null or p_starts_at <= now() then
    raise exception 'The event date must be in the future';
  end if;

  if p_price_cents is null or p_price_cents < 0 then
    raise exception 'The ticket price must be zero or more';
  end if;

  select capacity into v_capacity from public.venues where id = p_venue_id;
  if not found then
    raise exception 'Venue not found';
  end if;

  insert into public.events (organizer_id, venue_id, name, artist, category, starts_at, image_url)
  values (auth.uid(), p_venue_id, p_name, nullif(trim(p_artist), ''), p_category, p_starts_at, p_image_url)
  returning id into v_event_id;

  insert into public.tickets (event_id, seat_number, price_cents)
  select v_event_id, seat, p_price_cents
  from generate_series(1, v_capacity) as seat;

  return v_event_id;
end;
$$;

-- Buys an unsold ticket from the event, or a listed ticket from its owner.
-- The row lock (for update) makes simultaneous buyers queue up, so only the
-- first one gets the seat.
create function public.buy_ticket(p_ticket_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_buyer uuid := auth.uid();
  v_ticket public.tickets;
begin
  if v_buyer is null then
    raise exception 'You must be signed in to buy tickets';
  end if;

  select * into v_ticket from public.tickets where id = p_ticket_id for update;
  if not found then
    raise exception 'Ticket not found';
  end if;

  if (select starts_at from public.events where id = v_ticket.event_id) <= now() then
    raise exception 'This event has already started';
  end if;

  if v_ticket.status = 'available' then
    update public.tickets
    set owner_id = v_buyer, status = 'sold'
    where id = p_ticket_id;

    insert into public.ticket_transactions (ticket_id, from_user, to_user, price_cents, kind)
    values (p_ticket_id, null, v_buyer, v_ticket.price_cents, 'purchase');

  elsif v_ticket.status = 'listed' then
    if v_ticket.owner_id = v_buyer then
      raise exception 'You already own this ticket';
    end if;

    update public.tickets
    set owner_id = v_buyer, status = 'sold', list_price_cents = null
    where id = p_ticket_id;

    insert into public.ticket_transactions (ticket_id, from_user, to_user, price_cents, kind)
    values (p_ticket_id, v_ticket.owner_id, v_buyer, v_ticket.list_price_cents, 'resale');

  else
    raise exception 'This ticket is not for sale';
  end if;
end;
$$;

-- Puts a ticket you own up for resale.
create function public.list_ticket(p_ticket_id uuid, p_price_cents int)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if p_price_cents is null or p_price_cents <= 0 then
    raise exception 'The resale price must be more than zero';
  end if;

  update public.tickets t
  set status = 'listed', list_price_cents = p_price_cents
  where t.id = p_ticket_id
    and t.owner_id = auth.uid()
    and t.status = 'sold'
    and exists (
      select 1 from public.events e
      where e.id = t.event_id and e.starts_at > now()
    );

  if not found then
    raise exception 'You can only list a ticket you own, for an upcoming event, that isn''t already listed';
  end if;
end;
$$;

-- Takes a ticket you listed off the resale market. You keep it.
create function public.unlist_ticket(p_ticket_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.tickets
  set status = 'sold', list_price_cents = null
  where id = p_ticket_id
    and owner_id = auth.uid()
    and status = 'listed';

  if not found then
    raise exception 'You can only cancel listings for your own tickets';
  end if;
end;
$$;

-- Gives a ticket you own to another Tixly user, looked up by email.
-- Transferring a listed ticket also cancels the listing.
create function public.transfer_ticket(p_ticket_id uuid, p_recipient_email text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_sender uuid := auth.uid();
  v_recipient uuid;
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

  update public.tickets
  set owner_id = v_recipient, status = 'sold', list_price_cents = null
  where id = p_ticket_id
    and owner_id = v_sender
    and status in ('sold', 'listed');

  if not found then
    raise exception 'You can only transfer tickets you own';
  end if;

  insert into public.ticket_transactions (ticket_id, from_user, to_user, price_cents, kind)
  values (p_ticket_id, v_sender, v_recipient, null, 'transfer');
end;
$$;

-- Only signed-in users may call these.
revoke execute on function public.create_event(text, text, public.event_category, timestamptz, uuid, int, text) from public, anon;
revoke execute on function public.buy_ticket(uuid) from public, anon;
revoke execute on function public.list_ticket(uuid, int) from public, anon;
revoke execute on function public.unlist_ticket(uuid) from public, anon;
revoke execute on function public.transfer_ticket(uuid, text) from public, anon;

grant execute on function public.create_event(text, text, public.event_category, timestamptz, uuid, int, text) to authenticated;
grant execute on function public.buy_ticket(uuid) to authenticated;
grant execute on function public.list_ticket(uuid, int) to authenticated;
grant execute on function public.unlist_ticket(uuid) to authenticated;
grant execute on function public.transfer_ticket(uuid, text) to authenticated;
