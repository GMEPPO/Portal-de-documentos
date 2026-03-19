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

## Checklist: commit y Vercel (evitar errores de build)

Este proyecto usa **solo App Router** (`app/`). No debe existir `src/pages` ni código Vite/React Router en el repo.

### 1) Comprobar antes de hacer push

```bash
git ls-files src/pages
```

- Si lista archivos, el índice de Git sigue teniendo el legado. Elimínalos del repo:

```bash
git rm -r --cached src/pages 2>nul || true
git rm -r src/pages 2>nul || true
```

(Repite con `src/` entero si aún existe en el disco y no lo necesitas.)

```bash
git grep -n "mockDocuments\|StatusBadge\|react-router-dom" || echo "OK: sin referencias legacy"
```

### 2) Build local (opcional pero recomendable)

```bash
npm install
npm run build
```

### 3) Commit y push

```bash
git add -A
git status
git commit -m "chore: Next.js App Router, sin src/pages legacy"
git push origin main
```

### 4) Vercel

- Redeploy del proyecto enlazado a este repo/rama.
- Activa **Clear build cache** si antes falló por rutas antiguas.

### Archivos que marcan la arquitectura correcta

- `app/` (rutas y API)
- `tsconfig.json` excluye `src` del typecheck
- `.vercelignore` ignora `src` por si alguien lo vuelve a añadir por error
- `.gitignore` ignora `.next`, `node_modules`, `.env.local`, etc.
