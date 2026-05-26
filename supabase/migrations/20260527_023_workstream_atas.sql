-- Atas estruturadas por workstream com suporte a geração por IA
-- Cada ata está associada a um workstream (ws1–ws4) e a uma data de reunião.
-- O campo contramedidas é armazenado como JSONB: [{action, owner, deadline}].

create table if not exists public.workstream_atas (
  id                     uuid        primary key default gen_random_uuid(),
  workstream             text        not null
                                       check (workstream in ('ws1', 'ws2', 'ws3', 'ws4')),
  meeting_date           date        not null,
  transcript             text,
  situacao_atual         text        not null default '',
  problemas_identificados text       not null default '',
  contramedidas          jsonb       not null default '[]'::jsonb,
  proximos_passos        text        not null default '',
  participantes          text        not null default '',
  created_by             uuid        references public.users(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Uma ata por workstream por data
create unique index if not exists workstream_atas_ws_date_idx
  on public.workstream_atas(workstream, meeting_date);

-- RLS: leitura para authenticated, escrita apenas via service_role
alter table public.workstream_atas enable row level security;

create policy "workstream_atas_select_authenticated"
  on public.workstream_atas
  for select to authenticated
  using (true);

create policy "workstream_atas_all_service_role"
  on public.workstream_atas
  for all to service_role
  using (true);

-- Trigger para atualizar updated_at automaticamente
create trigger workstream_atas_updated_at
  before update on public.workstream_atas
  for each row execute function public.set_events_updated_at();
