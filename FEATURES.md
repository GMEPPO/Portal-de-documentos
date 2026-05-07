# Portal de Documentos — Funcionalidades

## Desenvolvidas

### Autenticação e Controlo de Acesso
- Login com Supabase Auth
- Perfis de utilizador: **viewer**, **editor**, **manager**, **admin**
- Row Level Security (RLS) — cada utilizador só vê o que tem permissão
- Gestão de utilizadores e atribuição de perfis (admin)

### Documentos
- Criação, edição e arquivo de documentos
- Upload de ficheiros (PDF, Word, imagens, etc.) via Supabase Storage
- Versionamento — histórico de versões por documento
- Workflow de publicação: Rascunho → Em revisão → Publicado → Arquivado
- Leitor de documentos integrado (split view)
- Tags por departamento para categorização

### Comunicações
- Criação de comunicações internas dirigidas a departamentos
- Anexos de documentos do portal a comunicações
- Envio por email via n8n webhook
- Página de detalhe por comunicação

### Eventos
- Criação e edição de eventos internos
- Registo de participantes
- Listagem e detalhe por evento

### Administração
- Gestão de utilizadores (perfis, departamentos)
- Gestão de tags por departamento
- Dashboard com indicadores de actividade

### Qualidade e Infraestrutura
- 41 testes automatizados (Jest)
- Migrações de base de dados versionadas (Supabase)
- Suporte a português e espanhol (i18n)

---

## Previstas

### Documentos
- Pesquisa full-text por conteúdo dos documentos
- Notificações quando um documento é publicado ou actualizado
- Comentários e anotações em documentos
- Aprovação de versões com assinatura digital simples

### Comunicações e Eventos
- Confirmação de leitura de comunicações
- Calendário de eventos integrado
- Notificações push / in-app

### Administração
- Relatórios de actividade por utilizador e departamento
- Auditoria de acções (quem fez o quê e quando)
- Exportação de relatórios em PDF/Excel

### Integrações
- Integração com Microsoft Teams para notificações
- SSO com conta Microsoft (Azure AD)
- Conectores para sistemas ERP internos
