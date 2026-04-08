grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.document_chunks to authenticated;

alter table public.document_chunks enable row level security;

drop policy if exists "document_chunks_authenticated_select" on public.document_chunks;
drop policy if exists "document_chunks_authenticated_insert" on public.document_chunks;
drop policy if exists "document_chunks_authenticated_update" on public.document_chunks;
drop policy if exists "document_chunks_authenticated_delete" on public.document_chunks;

create policy "document_chunks_authenticated_select"
on public.document_chunks
for select
to authenticated
using (true);

create policy "document_chunks_authenticated_insert"
on public.document_chunks
for insert
to authenticated
with check (true);

create policy "document_chunks_authenticated_update"
on public.document_chunks
for update
to authenticated
using (true)
with check (true);

create policy "document_chunks_authenticated_delete"
on public.document_chunks
for delete
to authenticated
using (true);
