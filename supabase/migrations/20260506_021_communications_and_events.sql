-- Gestão de Comunicações: comunicações ligadas a documentos + eventos
-- (reuniões, formações, apresentações) com participantes e atas.

create extension if not exists pgcrypto;

------------------------------------------------------------
-- 1. Departamento opcional na tabela document_tags
------------------------------------------------------------
alter table public.document_tags
  add column if not exists department text;

create index if not exists document_tags_department_idx
  on public.document_tags(department)
  where department is not null;

------------------------------------------------------------
-- 2. communications (cabeçalho da comunicação)
------------------------------------------------------------
create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  subject text not null,
  message text not null,
  sent_by uuid not null references public.users(id) on delete restrict,
  sent_at timestamptz not null default now(),
  n8n_status text not null default 'pending'
    check (n8n_status in ('pending', 'sent', 'failed')),
  n8n_error text,
  recipient_count int not null default 0,
  tags_snapshot text[] not null default '{}',
  departments_snapshot text[] not null default '{}'
);

create index if not exists communications_document_id_idx
  on public.communications(document_id);
create index if not exists communications_sent_at_idx
  on public.communications(sent_at desc);

alter table public.communications enable row level security;

drop policy if exists "communications_authenticated_select" on public.communications;
create policy "communications_authenticated_select"
  on public.communications for select to authenticated using (true);

grant select on table public.communications to authenticated;
grant all on table public.communications to service_role;

------------------------------------------------------------
-- 3. communication_recipients (snapshot — não fazer JOIN a users em leitura)
------------------------------------------------------------
create table if not exists public.communication_recipients (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  email text not null,
  name text,
  department text,
  unique(communication_id, email)
);

create index if not exists communication_recipients_comm_idx
  on public.communication_recipients(communication_id);

alter table public.communication_recipients enable row level security;

drop policy if exists "communication_recipients_authenticated_select"
  on public.communication_recipients;
create policy "communication_recipients_authenticated_select"
  on public.communication_recipients for select to authenticated using (true);

grant select on table public.communication_recipients to authenticated;
grant all on table public.communication_recipients to service_role;

------------------------------------------------------------
-- 4. communication_attachments (anexos no bucket "documents", prefixo communications/)
------------------------------------------------------------
create table if not exists public.communication_attachments (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid not null references public.communications(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists communication_attachments_comm_idx
  on public.communication_attachments(communication_id);

alter table public.communication_attachments enable row level security;

drop policy if exists "communication_attachments_authenticated_select"
  on public.communication_attachments;
create policy "communication_attachments_authenticated_select"
  on public.communication_attachments for select to authenticated using (true);

grant select on table public.communication_attachments to authenticated;
grant all on table public.communication_attachments to service_role;

------------------------------------------------------------
-- 5. events (reuniões / formações / apresentações)
------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  description text,
  kind text not null default 'meeting'
    check (kind in ('meeting', 'training', 'presentation', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  is_online boolean not null default false,
  online_url text,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_location_or_online_chk
    check (is_online = true or location is not null),
  constraint events_dates_chk
    check (ends_at is null or ends_at >= starts_at)
);

create index if not exists events_starts_at_idx on public.events(starts_at desc);
create index if not exists events_kind_idx on public.events(kind);

create or replace function public.set_events_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_events_updated_at();

alter table public.events enable row level security;

drop policy if exists "events_authenticated_select" on public.events;
create policy "events_authenticated_select"
  on public.events for select to authenticated using (true);

grant select on table public.events to authenticated;
grant all on table public.events to service_role;

------------------------------------------------------------
-- 6. event_documents (documentos ligados ao evento; role 'related' ou 'minutes')
------------------------------------------------------------
create table if not exists public.event_documents (
  event_id uuid not null references public.events(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  role text not null default 'related'
    check (role in ('related', 'minutes')),
  primary key (event_id, document_id, role)
);

create index if not exists event_documents_document_id_idx
  on public.event_documents(document_id);

alter table public.event_documents enable row level security;

drop policy if exists "event_documents_authenticated_select" on public.event_documents;
create policy "event_documents_authenticated_select"
  on public.event_documents for select to authenticated using (true);

grant select on table public.event_documents to authenticated;
grant all on table public.event_documents to service_role;

------------------------------------------------------------
-- 7. event_attendees
------------------------------------------------------------
create table if not exists public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_attendees_user_id_idx on public.event_attendees(user_id);

alter table public.event_attendees enable row level security;

drop policy if exists "event_attendees_authenticated_select" on public.event_attendees;
create policy "event_attendees_authenticated_select"
  on public.event_attendees for select to authenticated using (true);

grant select on table public.event_attendees to authenticated;
grant all on table public.event_attendees to service_role;
