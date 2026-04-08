grant usage on schema public to anon;
grant select, insert, update, delete on table public.document_chunks to anon;

alter table public.document_chunks enable row level security;

drop policy if exists "document_chunks_anon_select" on public.document_chunks;
drop policy if exists "document_chunks_anon_insert" on public.document_chunks;
drop policy if exists "document_chunks_anon_update" on public.document_chunks;
drop policy if exists "document_chunks_anon_delete" on public.document_chunks;

create policy "document_chunks_anon_select"
on public.document_chunks
for select
to anon
using (true);

create policy "document_chunks_anon_insert"
on public.document_chunks
for insert
to anon
with check (true);

create policy "document_chunks_anon_update"
on public.document_chunks
for update
to anon
using (true)
with check (true);

create policy "document_chunks_anon_delete"
on public.document_chunks
for delete
to anon
using (true);
