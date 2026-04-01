alter table documents
add column if not exists document_type text;

update documents
set document_type = coalesce(document_type, 'document')
where document_type is null;

alter table documents
alter column document_type set default 'document';

alter table documents
alter column document_type set not null;

alter table documents
drop constraint if exists documents_document_type_check;

alter table documents
add constraint documents_document_type_check
check (document_type in ('document', 'video', 'audio'));

alter table document_versions
add column if not exists file_type text;

update document_versions
set file_type = coalesce(file_type, 'document')
where file_type is null;

alter table document_versions
alter column file_type set default 'document';

alter table document_versions
alter column file_type set not null;

alter table document_versions
drop constraint if exists document_versions_file_type_check;

alter table document_versions
add constraint document_versions_file_type_check
check (file_type in ('document', 'video', 'audio'));
