create table if not exists users (
  id uuid primary key,
  name text not null,
  email text unique not null,
  role text not null check (role in ('viewer', 'editor', 'manager', 'admin')),
  department text not null,
  created_at timestamptz default now()
);

create table if not exists document_categories (
  id uuid primary key,
  name text not null unique
);

insert into document_categories (id, name)
values
  ('11111111-1111-1111-1111-111111111111', 'Acordo Comercial'),
  ('22222222-2222-2222-2222-222222222222', 'Apresentacao Institucional'),
  ('33333333-3333-3333-3333-333333333333', 'Ata de Reuniao'),
  ('44444444-4444-4444-4444-444444444444', 'Comunicado Interno'),
  ('55555555-5555-5555-5555-555555555555', 'Financeiro'),
  ('66666666-6666-6666-6666-666666666666', 'Formulario de Pedido'),
  ('77777777-7777-7777-7777-777777777777', 'Instrucao de Trabalho'),
  ('88888888-8888-8888-8888-888888888888', 'Nomenclatura'),
  ('99999999-9999-9999-9999-999999999999', 'Procedimento Especifico'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Procedimento Geral'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Processo'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'RH')
on conflict (id) do update
set name = excluded.name;

create table if not exists documents (
  id uuid primary key,
  title text not null,
  summary text not null,
  category_id uuid references document_categories(id),
  department text not null,
  status text not null check (status in ('in_review', 'updating', 'published')),
  current_version int not null default 1,
  author_id uuid references users(id),
  owner_id uuid references users(id),
  main_file_path text,
  preview_file_path text,
  tags text[] default '{}',
  internal_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists document_versions (
  id uuid primary key,
  document_id uuid references documents(id) on delete cascade,
  version_number int not null,
  file_path text not null,
  changelog text not null,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create unique index if not exists document_versions_document_id_version_number_idx
on document_versions(document_id, version_number);

create table if not exists document_comments (
  id uuid primary key,
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  author_id uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key,
  event text not null,
  actor_id uuid references users(id),
  metadata jsonb,
  created_at timestamptz default now()
);
