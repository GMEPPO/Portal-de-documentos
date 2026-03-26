insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_authenticated_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'documents');

create policy "documents_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documents');

create policy "documents_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'documents')
with check (bucket_id = 'documents');

create policy "documents_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'documents');
