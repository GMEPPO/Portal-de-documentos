update documents
set status = case
  when status = 'published' then 'published'
  else 'in_review'
end;

alter table documents
drop constraint if exists documents_status_check;

alter table documents
add constraint documents_status_check
check (status in ('in_review', 'updating', 'published'));

create unique index if not exists document_versions_document_id_version_number_idx
on document_versions(document_id, version_number);
