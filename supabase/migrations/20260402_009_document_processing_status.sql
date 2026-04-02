alter table documents
add column if not exists preview_status text default 'skipped';

alter table documents
add column if not exists search_status text default 'skipped';

alter table documents
add column if not exists preview_error text;

alter table documents
add column if not exists search_error text;

update documents
set
  preview_status = coalesce(preview_status, 'skipped'),
  search_status = coalesce(search_status, 'skipped');

alter table documents
alter column preview_status set default 'skipped';

alter table documents
alter column search_status set default 'skipped';

alter table documents
alter column preview_status set not null;

alter table documents
alter column search_status set not null;

alter table documents
drop constraint if exists documents_preview_status_check;

alter table documents
add constraint documents_preview_status_check
check (preview_status in ('pending', 'processing', 'ready', 'failed', 'skipped'));

alter table documents
drop constraint if exists documents_search_status_check;

alter table documents
add constraint documents_search_status_check
check (search_status in ('pending', 'processing', 'ready', 'failed', 'skipped'));
