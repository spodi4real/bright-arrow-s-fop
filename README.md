# BrightArrow

Field operations platform — missions, KPIs, expenses, and reports.

Single Next.js 14 / TypeScript / Prisma / PostgreSQL codebase. Built for Windows; portable to any server via `.env`.

## Quick start

```bash
npm install
npm run db:migrate          # create the database schema
npm run db:seed             # seed users, contractors, default exchange rate
npm run dev                 # http://localhost:3000  (or 3001 if 3000 is busy)
```

The seed creates 9 accounts. Sign in with:

| Username | Password | Role |
|----------|----------|------|
| majed | admin123 | admin |
| supervisor1 | super123 | supervisor |
| iskra.install | iskra123 | iskra |
| iskra.maint | iskra123 | iskra |
| iskra.arch | iskra123 | iskra |
| accountant | acct123 | accountant |
| eng1 | eng123 | engineer |
| eng2 | eng123 | engineer |
| eng3 | eng123 | engineer |

Files are saved under `D:\BrightArrow\` (configured by `FILE_STORAGE_ROOT`).

## Configuration — `.env`

```env
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres:brightarrow123@localhost:5432/brightarrow

JWT_SECRET=long-random-string-32-chars-or-more
SESSION_COOKIE_NAME=brightarrow_session

FILE_STORAGE_ROOT=D:\BrightArrow
DEFAULT_EXCHANGE_RATE=1500
MAX_UPLOAD_SIZE_MB=100
```

Moving from a laptop to a Windows server is purely an `.env` change: update `DATABASE_URL`, `FILE_STORAGE_ROOT`, and `BASE_URL`. No code changes.

## Project structure

```
prisma/
  schema.prisma         Full data model (users, missions, items, finances, agenda, files)
  seed.ts               Seeds users, contractors, exchange rate
src/
  app/
    (auth)/login/       Login page
    (app)/              Authenticated routes (sidebar layout)
    api/                JSON / file API routes (all permission-checked)
  components/
    brand/Wordmark      The BrightArrow wordmark component
    app-shell/          Sidebar, top bar, mobile bottom nav, page header
    ui/                 Buttons, dialogs, tables, etc.
  lib/
    auth.ts             JWT sessions, password hashing
    permissions.ts      Role → action matrix
    prisma.ts           Prisma singleton
    storage.ts          Filesystem helpers under FILE_STORAGE_ROOT
    missions.ts         Mission helpers (paths, slugs, access checks)
    bonus.ts            Bonus + target + contractor score math
    currency.ts         Exchange rate read/write
    reports.ts          Excel header styling helpers
    pdf/                React-PDF report components
```

## Roles

| Role | Access summary |
|------|----------------|
| **Admin** | Everything: missions, finances, KPI, bonus, reports, users. |
| **Supervisor** | Missions, KPI/bonus, agenda (everyone), mission reports. No finance, no admin reports. |
| **Iskra** | Missions, files. No finance, no KPI, no scores, no targets. |
| **Accountant** | Only finance: expenses, pocket money, exchange rate, expense receipts. |
| **Engineer** | Own missions, own expenses, own pocket money balance. Targets are visible only if shared. No KPI/score visibility. |

All permission checks live in `src/lib/permissions.ts` and are enforced server-side in every API route.

## Mission types

1. **RF Site Survey** — register gateways with pole photo, area video, signal screenshots (Korek/Zain/Asiacell), coordinates. Excel report.
2. **Site Maintenance** — register meters with status (resolved/ongoing/out of scope), photo, description. Excel report.
3. **Installation Supervising** — record meters checked + free-form notes. **PDF report** with brand wordmark, day-grouped notes, and end-of-mission summary.

Each mission auto-creates a folder on disk:
- `D:\BrightArrow\site_surveys\{slug}_{id}\{gatewayId}\`
- `D:\BrightArrow\site_maintenance\{slug}_{id}\{serial}\`
- `D:\BrightArrow\installations\{slug}_{id}\meters\{serial}\` and `\notes\{noteId}\`

Files are **never** served directly from D: — every download goes through `/api/files/{id}` which checks the user's permission to see that file.

## Reports

- Mission report (per-mission Excel or PDF).
- Admin reports page (`/reports`) exports: missions, violations, expenses, KPI, agenda, contractor performance — all as Excel.

## Backups

To back up the system, snapshot two things:

1. **PostgreSQL database**:
   ```
   "C:\Program Files\PostgreSQL\17\bin\pg_dump" -U postgres -F c brightarrow > brightarrow.dump
   ```
2. **The storage folder**: just copy `D:\BrightArrow` somewhere safe.

Restore with `pg_restore` and copy the folder back.

## Development scripts

```
npm run dev          # start Next.js dev server
npm run build        # production build
npm run start        # serve production build
npm run db:migrate   # apply schema migrations
npm run db:push      # push schema without migration (dev only)
npm run db:seed      # seed initial data
npm run db:studio    # open Prisma Studio
```

## Tech stack

- Next.js 14 App Router + TypeScript
- Prisma ORM + PostgreSQL 15+
- Tailwind CSS + Radix UI primitives
- TanStack Query for data fetching (forms paused during edits)
- ExcelJS + @react-pdf/renderer for reports
- bcryptjs + jose for auth
- @tmcw/togeojson, jszip, papaparse for KML/KMZ/CSV/XLSX parsing
