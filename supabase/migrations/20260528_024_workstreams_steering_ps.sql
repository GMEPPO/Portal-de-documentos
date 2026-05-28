-- Permite múltiplas atas por workstream na mesma data
-- e adiciona os workstreams Steering e Progresso Semanal

-- 1. Remover índice único (workstream, meeting_date)
DROP INDEX IF EXISTS public.workstream_atas_ws_date_idx;

-- 2. Criar índice normal para performance
CREATE INDEX IF NOT EXISTS workstream_atas_ws_date_idx
  ON public.workstream_atas(workstream, meeting_date DESC);

-- 3. Actualizar check constraint para incluir novos workstreams
ALTER TABLE public.workstream_atas
  DROP CONSTRAINT IF EXISTS workstream_atas_workstream_check;

ALTER TABLE public.workstream_atas
  ADD CONSTRAINT workstream_atas_workstream_check
  CHECK (workstream IN ('ws1', 'ws2', 'ws3', 'ws4', 'steering', 'ps'));
