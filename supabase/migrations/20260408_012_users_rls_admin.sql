grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on table public.users to authenticated, service_role;

alter table public.users enable row level security;

drop policy if exists "users_self_select" on public.users;
drop policy if exists "users_admin_select" on public.users;
drop policy if exists "users_admin_insert" on public.users;
drop policy if exists "users_admin_update" on public.users;
drop policy if exists "users_admin_delete" on public.users;

create policy "users_self_select"
on public.users
for select
to authenticated
using (id = auth.uid());

create policy "users_admin_select"
on public.users
for select
to authenticated
using (
  exists (
    select 1
    from public.users as actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "users_admin_insert"
on public.users
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users as actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "users_admin_update"
on public.users
for update
to authenticated
using (
  exists (
    select 1
    from public.users as actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.users as actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);

create policy "users_admin_delete"
on public.users
for delete
to authenticated
using (
  exists (
    select 1
    from public.users as actor
    where actor.id = auth.uid()
      and actor.role = 'admin'
  )
);
