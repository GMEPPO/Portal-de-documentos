alter table documents
add column if not exists preview_file_path text;

update documents
set status = case
  when status = 'published' then 'published'
  else 'in_review'
end;

alter table documents
drop constraint if exists documents_status_check;

alter table documents
add constraint documents_status_check
check (status in ('in_review', 'published'));
