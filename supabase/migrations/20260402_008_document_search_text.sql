alter table documents
add column if not exists search_text text;

alter table documents
add column if not exists search_text_updated_at timestamptz;
