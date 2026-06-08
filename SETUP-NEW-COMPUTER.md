# BrightArrow — Setup on the Company Computer

This guide takes a **brand-new** Windows PC (with Node.js + VS Code already installed)
to a fully running BrightArrow instance. Follow the steps in order.

> Estimated time: ~20–30 minutes, most of it waiting on installers.

---

## What this PC needs that it doesn't have yet

The app will NOT run with only Node.js. You must also install:

1. **PostgreSQL 17** — the database engine (this is the big missing piece).
2. The BrightArrow code (from the ZIP you copied over).

Node.js is already installed ✅ and VS Code is already installed ✅.

---

## Step 1 — Install PostgreSQL 17

1. Download the Windows installer (version **17.x**, same major version as the dev laptop):
   https://www.postgresql.org/download/windows/  →  "Download the installer".
2. Run it. During setup:
   - **Password for the `postgres` superuser**: choose one and **write it down**.
     The simplest path is to reuse the dev password `brightarrow123` so the
     `.env` below works unchanged. If you pick a different password, update
     `DATABASE_URL` in Step 4 to match.
   - **Port**: leave it at **5432** (the default).
   - You can untick "Stack Builder" at the end — it's not needed.

   
3. Finish the install. PostgreSQL now runs automatically as a Windows service.

### (Optional but recommended) Add `psql` to PATH
So you can run database commands from any terminal:
- The tools live in `C:\Program Files\PostgreSQL\17\bin`.
- Add that folder to the Windows **Path** environment variable, or just use the
  full path when needed.

---

## Step 2 — Create the empty database

Open **PowerShell** and run (enter the postgres password when asked):

```powershell
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U postgres -h localhost brightarrow
```

That creates an empty database named `brightarrow`. The schema gets created in Step 5.

---

## Step 3 — Put the code in place

1. Copy the ZIP onto this PC and **extract** it to a permanent location, e.g.
   `C:\BrightArrow-app\` (or wherever you want the app to live).
2. Open that folder in **VS Code** (File → Open Folder).

---

## Step 4 — Create the `.env` configuration file

The ZIP ships with `.env.example` but **not** `.env` (secrets are never copied).

1. Make a copy of `.env.example` and rename the copy to `.env`.
2. Open `.env` and review these values:

   ```env
   NODE_ENV=production
   PORT=3000
   BASE_URL=http://localhost:3000

   # Must match the postgres password you set in Step 1.
   DATABASE_URL=postgresql://postgres:brightarrow123@localhost:5432/brightarrow

   # Generate a NEW long random secret — see command below. Do not reuse the dev one.
   JWT_SECRET=replace-with-a-long-random-string-at-least-32-chars
   SESSION_COOKIE_NAME=brightarrow_session

   # Where uploaded files are stored. This folder MUST exist on THIS PC.
   # If this PC has no D: drive, change it (e.g. C:\BrightArrow).
   FILE_STORAGE_ROOT=D:\BrightArrow

   DEFAULT_EXCHANGE_RATE=1500
   MAX_UPLOAD_SIZE_MB=100
   ```

3. **Generate a fresh `JWT_SECRET`** (don't reuse the dev one). In PowerShell:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

   Paste the output as the `JWT_SECRET` value.

4. **Create the file-storage folder** you set in `FILE_STORAGE_ROOT`. Example:

   ```powershell
   New-Item -ItemType Directory -Force "D:\BrightArrow"
   ```

---

## Step 5 — Install dependencies and build the database schema

In a PowerShell terminal **inside the app folder** (in VS Code: Terminal → New Terminal):

```powershell
npm install              # download dependencies (one-time, may take a few minutes)
npx prisma migrate deploy   # create all tables in the brightarrow database
npm run db:seed          # add the 9 baseline users + contractors + exchange rate
```

After `db:seed` you have a pristine database — no test data, just the starting accounts.

---

## Step 6 — Run the app

For permanent/company use, build once and run in production mode:

```powershell
npm run build            # compile the app (one-time per code update)
npm start                # starts the server on http://localhost:3000
```

Open a browser to **http://localhost:3000** and sign in.

> Prefer development mode while testing? Use `npm run dev` instead of build/start.

---

## Step 7 — Sign in

The seed created these accounts (same as the dev laptop). The admin can add/edit
users and change passwords inside the app afterwards.

| Username       | Password  | Role        |
|----------------|-----------|-------------|
| majed          | admin123  | admin       |
| supervisor1    | super123  | supervisor  |
| iskra.install  | iskra123  | iskra       |
| iskra.maint    | iskra123  | iskra       |
| iskra.arch     | iskra123  | iskra       |
| accountant     | acct123   | accountant  |
| eng1           | eng123    | engineer    |
| eng2           | eng123    | engineer    |
| eng3           | eng123    | engineer    |

> **Security tip:** these are well-known defaults. Sign in as `majed` first and
> change at least the admin password before real use.

---

## Keeping it running

- `npm start` runs only while that terminal is open. To keep BrightArrow running
  in the background (and auto-start on reboot), install a process manager:

  ```powershell
  npm install -g pm2
  pm2 start "npm start" --name brightarrow
  pm2 save
  pm2 startup        # follow the printed instruction to enable auto-start
  ```

---

## Troubleshooting

- **`P1001` / "Can't reach database server"** — PostgreSQL isn't running or the
  password/port in `DATABASE_URL` is wrong. Check the service in
  `services.msc` ("postgresql-x64-17") and re-verify Step 1's password.
- **Upload errors / "ENOENT" on file save** — the `FILE_STORAGE_ROOT` folder
  doesn't exist. Create it (Step 4.4).
- **Port 3000 in use** — change `PORT` in `.env`, or stop whatever uses 3000.
- **`prisma` command not found** — run `npm install` first (Step 5).
