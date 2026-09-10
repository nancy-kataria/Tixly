-- Buyers' names and photos shouldn't be public. You can see your own
-- profile, plus organizers' profiles (they appear on event pages).
drop policy "Profiles are viewable by everyone" on public.profiles;

create policy "Users see their own profile and organizers' profiles"
  on public.profiles for select
  using ((select auth.uid()) = id or role = 'organizer');

-- The only way to change your role: users can't update profiles.role
-- directly (see the create_profiles migration).
create function public.become_organizer()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in';
  end if;

  update public.profiles
  set role = 'organizer'
  where id = auth.uid();
end;
$$;

revoke execute on function public.become_organizer() from public, anon;
grant execute on function public.become_organizer() to authenticated;
