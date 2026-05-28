-- Concede permissões de escrita ao service_role nas tabelas de documentos
-- necessárias para o sync automático ata → documento

GRANT INSERT, UPDATE, DELETE ON public.documents TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.document_versions TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.document_version_files TO service_role;
