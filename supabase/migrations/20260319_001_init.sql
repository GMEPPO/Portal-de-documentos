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

create table if not exists documents (
  id uuid primary key,
  title text not null,
  summary text not null,
  category_id uuid references document_categories(id),
  department text not null,
  status text not null check (status in ('draft', 'in_review', 'approved', 'published', 'archived', 'rejected')),
  current_version int not null default 1,
  author_id uuid references users(id),
  owner_id uuid references users(id),
  main_file_path text,
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
