create extension if not exists pgcrypto;

create table if not exists public.document_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.document_tags enable row level security;

drop policy if exists "document_tags_authenticated_select" on public.document_tags;
create policy "document_tags_authenticated_select"
on public.document_tags
for select
to authenticated
using (true);

grant select on table public.document_tags to authenticated;
grant all on table public.document_tags to service_role;

