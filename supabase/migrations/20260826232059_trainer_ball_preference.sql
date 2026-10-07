alter table public.profiles
  add column trainer_ball text not null default 'poke'
  check (trainer_ball in ('poke','great','ultra','master','premier','luxury','heal','quick','dusk','dive','net','nest','repeat','timer','friend','love','level','lure','moon','heavy','fast','dream','beast','cherish'));

grant update (trainer_ball) on public.profiles to authenticated;

create policy "Users can update their own trainer ball"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
