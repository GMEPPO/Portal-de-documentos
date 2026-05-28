-- Adiciona coluna document_id à tabela workstream_atas
-- para ligar cada ata ao documento correspondente no sistema de documentos

ALTER TABLE public.workstream_atas
  ADD COLUMN IF NOT EXISTS document_id uuid
  REFERENCES public.documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS workstream_atas_document_id_idx
  ON public.workstream_atas(document_id)
  WHERE document_id IS NOT NULL;
