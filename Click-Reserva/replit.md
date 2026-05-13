# ClickReserva

Sistema de agendamento de laboratórios de informática para o C.E. Prof. Mario B.T. Braga (escola estadual brasileira).

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Application

**ClickReserva** — classroom booking system for computer labs.

### Features
- Professor/coordinator/admin roles (admin = full access: makes reservations + approves + manages everything)
- Room scheduling with real-time conflict detection
- Attendance confirmation during class time
- Automatic absence tracking with professor blocking
- Coordinator/admin panel (professors, rooms, config)
- Registration approval workflow: new professors self-register → pending state → coordinator/admin approves/rejects
- Role change: coordinator can change any user's role (professor/coordinator/admin) from the professor management page
- Email domain validation on registration (allows @escola.pr.gov.br, @escola.edu.br, .edu.br, emails com "escola"/"edu")
- Coordinator-mediated password reset: professor requests reset → coordinator sees pending request → sets new password manually
- Calendar view on /reservas: weekly grid (Mon–Sat) with standard school time slots as rows
- 3-mode reservations view: Cards / Tabela (default) / Calendário semanal
- Browser notifications: upcoming reminder (3–12 min before) + presence reminders every 5 min after class start
- Email notifications (10, 5, 1 min before): requires RESEND_API_KEY env secret — infra ready via email-cron.ts
- Email templates: fully in PT-BR, rich HTML layout with school branding (green header, info table, footer); three email types: lembrete de aula, cadastro aprovado, redefinição de senha
- Feedback system: professors submit star-rating + category + message (optional anonymous); coordinator sees all with stats
- **Relatório Mensal** (`/relatorio`): professors see their own monthly stats; coordinators see all professors with aggregated totals — filterable by month (last 6 months); shows realizadas/confirmadas/aguardando/canceladas/faltas/recusadas
- **Justificativa de Faltas** (`/coordenador/justificativas`): coordinator/admin can justify `no_show` reservations with a note; justified absences are decremented from the professor's totalAbsences; status changes from `no_show` → `justified`; backend: `POST /api/reservations/:id/justify`, `GET /api/no-shows`
- **DB fields added**: `justificationNote`, `justifiedAt`, `justifiedByUserId` on reservations table
- **React Query cache**: staleTime=1 week, gcTime=1 week, refetchOnWindowFocus=false; on Saturdays the cache is cleared automatically (`queryClient.clear()`) for a fresh weekly start
- Green color theme (forest green palette, dark sidebar)
- All UI in Portuguese (Brazil)

### Credentials (dev seed data)
- **Coordinator**: coordenador@escola.pr.gov.br / coordenador123 — also svbarros.adm@gmail.com / Bento2705@
- **Professors**: ana.costa@escola.pr.gov.br / professor123
  - also: carlos.lima, roberto.mendes (blocked), fernanda.oliveira

### Brand
- Primary: deep blue `#1a4fa0` (HSL 216 72% 36%)
- Secondary: teal green `#0d7a5f` (HSL 165 81% 26%)

### Architecture notes
- `MainLayout` is mounted ONCE in `AuthenticatedApp` and persists across all route changes — do NOT move it inside individual routes, as this causes `removeChild` DOM errors.
- `RouteErrorBoundary` wraps each page component with a static `key` string so errors are isolated per route and the boundary can be reset without a full page reload.
- `safeFormatDate()` is the canonical date formatting helper defined in each page file that needs it — always use it instead of `format(new Date(...), ...)` directly.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: clickreserva, port 25358, preview at /)
- **API**: Express 5 (artifact: api-server, port 8080)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: express-session (cookie-based, SHA-256 password hashing with salt "clickreserva-salt")
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Frontend Pages

- `/login` — LoginPage
- `/` — DashboardPage (coordinator sees stats; all users see today's schedule + quick actions)
- `/reservas` — ReservationsPage (list with status filters, cancel button)
- `/reservas/nova` — NewReservationPage (form with real-time conflict detection)
- `/salas` — RoomsPage (grid of lab rooms)
- `/presenca` — PresencePage (confirm attendance during class time window)
- `/coordenador/professores` — CoordinatorProfessorsPage (CRUD for professors)
- `/coordenador/bloqueios` — CoordinatorBlockedPage (blocked professors + absence history)
- `/coordenador/salas` — CoordinatorRoomsPage (CRUD for rooms)
- `/coordenador/configuracoes` — CoordinatorConfigPage (absence limit + tolerance minutes)

## API Routes

All routes prefixed with `/api`:
- `GET /api/healthz` — health check
- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout  
- `GET /api/auth/me` — current user
- `POST /api/auth/register` — register new professor (pending state)
- `POST /api/auth/reset-request` — professor requests password reset (coordinator-mediated)
- `GET/POST /api/rooms` — list/create rooms
- `GET/PUT/DELETE /api/rooms/:roomId` — single room operations
- `GET/POST /api/reservations` — list/create reservations
- `PUT /api/reservations/:id/cancel` — cancel
- `PUT /api/reservations/:id/confirm-presence` — confirm attendance
- `GET /api/reservations/check-conflicts` — real-time conflict detection
- `GET/POST /api/professors` — list/create professors
- `PUT /api/professors/:id` — update professor
- `PUT /api/professors/:id/unblock` — unblock professor
- `GET /api/dashboard/stats` — coordinator dashboard stats
- `GET /api/dashboard/today` — today's schedule
- `GET /api/absences` — absence history
- `GET/PUT /api/config` — system configuration

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
