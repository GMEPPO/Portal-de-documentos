grant usage on schema public to service_role;

grant select on table public.documents to service_role;
grant select on table public.document_comments to service_role;
grant select on table public.document_versions to service_role;
grant select on table public.audit_logs to service_role;
