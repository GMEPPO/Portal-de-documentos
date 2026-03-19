# Plataforma Documental Interna

Base técnica construída com:
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + componentes estilo shadcn/ui (Radix)
- Supabase (Auth, DB y Storage)
- Zod + React Hook Form
- Jest + Testing Library

## Arranque rápido

1. Copia variables de entorno:
   - `cp .env.example .env.local`
2. Instala dependencias:
   - `npm install`
3. Ejecuta en desarrollo:
   - `npm run dev`

## Estructura principal

- `app/`: páginas, layouts y route handlers
- `app/api/`: endpoints internos REST-like
- `components/ui/`: componentes base reutilizables
- `components/documents/`: componentes del dominio documental
- `lib/`: auth, rbac, services, validations, clients y utilidades
- `supabase/migrations/`: esquema SQL inicial
- `scripts/`: seed y utilidades administrativas
- `__tests__/`: pruebas unitarias críticas

## Módulos implementados

- Login, dashboard y acceso denegado
- Lista de documentos
- Alta de documento
- Detalle de documento (metadatos, versiones, comentarios, auditoría)
- Área de administración de usuarios/permisos
- API interna:
  - `GET/POST /api/documents`
  - `GET/PATCH /api/documents/:id`
  - `POST /api/documents/:id/comments`
  - `POST /api/documents/:id/versions`

## RBAC inicial

- `viewer`: consulta
- `editor`: creación/edición/subida de versión
- `manager`: aprobación y transición avanzada
- `admin`: control total y gestión de usuarios

Las reglas viven en `lib/rbac.ts` y se validan en backend.

## Pruebas

- `npm run test`

Incluye tests para:
- RBAC
- validaciones de documento
- creación/actualización de documento
- transiciones de estado

## Supabase y despliegue

- Migración base en `supabase/migrations/20260319_001_init.sql`
- Proyecto listo para Vercel (`vercel.json` framework Next.js)
