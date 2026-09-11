-- Test helpers. Test files run in alphabetical order, so this one runs first
-- and commits; every other file rolls back. The helpers exist only in the
-- throwaway test database, not in the migrations.
begin;

create schema if not exists tests;

-- Creates a user the way Google sign-in would; the on_auth_user_created
-- trigger gives them a profile. Tests refer to users by name ('fan'), and
-- each gets the email '<name>@test.local'.
create or replace function tests.create_user(p_name text, p_role public.user_role default 'user')
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    p_name || '@test.local', '', now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_name),
    now(), now(), '', '', '', ''
  );

  update public.profiles set role = p_role where id = v_id;
  return v_id;
end;
$$;

create or replace function tests.user_id(p_name text)
returns uuid
language sql stable
security definer set search_path = ''
as $$
  select id from auth.users where email = p_name || '@test.local'
$$;

-- Runs the rest of the transaction as this user, like a request from the
-- app: the authenticated role, with auth.uid() returning the user's id.
create or replace function tests.authenticate_as(p_name text)
returns void
language plpgsql
as $$
declare
  v_id uuid := tests.user_id(p_name);
begin
  if v_id is null then
    raise exception 'Test user "%" does not exist', p_name;
  end if;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
end;
$$;

-- Runs the rest of the transaction as a signed-out visitor.
-- (Plain `reset role;` switches back to the all-powerful test connection.)
create or replace function tests.clear_authentication()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

create or replace function tests.create_venue(p_name text, p_capacity int)
returns uuid
language sql
security definer set search_path = ''
as $$
  insert into public.venues (name, address, capacity)
  values (p_name, '1 Test St', p_capacity)
  returning id
$$;

create or replace function tests.venue_id(p_name text)
returns uuid
language sql stable
security definer set search_path = ''
as $$
  select id from public.venues where name = p_name
$$;

-- Adds a section with p_capacity tickets, numbered from 1, to an event.
create or replace function tests.add_section(
  p_event_name text,
  p_section_name text,
  p_capacity int,
  p_price_cents int
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_event_id uuid;
  v_section_id uuid;
begin
  select id into strict v_event_id from public.events where name = p_event_name;

  insert into public.ticket_sections (event_id, name, price_cents, capacity, sort_order)
  values (
    v_event_id, p_section_name, p_price_cents, p_capacity,
    (select count(*) from public.ticket_sections where event_id = v_event_id) + 1
  )
  returning id into v_section_id;

  insert into public.tickets (event_id, section_id, number, price_cents)
  select v_event_id, v_section_id, n, p_price_cents
  from generate_series(1, p_capacity) as n;

  return v_section_id;
end;
$$;

-- An event at a new venue with one section, 'General', of p_capacity
-- tickets. Inserted directly, skipping create_event()'s checks, so tests can
-- set up any scenario (e.g. an event that has already started).
create or replace function tests.create_event(
  p_name text,
  p_organizer text,
  p_capacity int default 3,
  p_price_cents int default 5000,
  p_starts_at timestamptz default now() + interval '30 days'
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_event_id uuid;
begin
  insert into public.events (organizer_id, venue_id, name, category, starts_at)
  values (
    tests.user_id(p_organizer),
    tests.create_venue(p_name || ' Venue', p_capacity),
    p_name,
    'music',
    p_starts_at
  )
  returning id into v_event_id;

  perform tests.add_section(p_name, 'General', p_capacity, p_price_cents);
  return v_event_id;
end;
$$;

create or replace function tests.section_id(p_event_name text, p_section_name text default 'General')
returns uuid
language sql stable
security definer set search_path = ''
as $$
  select s.id
  from public.ticket_sections s
  join public.events e on e.id = s.event_id
  where e.name = p_event_name and s.name = p_section_name
$$;

create or replace function tests.ticket_id(p_event_name text, p_number int, p_section_name text default 'General')
returns uuid
language sql stable
security definer set search_path = ''
as $$
  select id
  from public.tickets
  where section_id = tests.section_id(p_event_name, p_section_name) and number = p_number
$$;

-- The full ticket row, read without access rules, for checking results.
create or replace function tests.ticket(p_event_name text, p_number int, p_section_name text default 'General')
returns public.tickets
language sql stable
security definer set search_path = ''
as $$
  select *
  from public.tickets
  where section_id = tests.section_id(p_event_name, p_section_name) and number = p_number
$$;

grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;

select plan(1);
select has_function('tests', 'authenticate_as', array['text'], 'test helpers are installed');
select * from finish();

commit;
