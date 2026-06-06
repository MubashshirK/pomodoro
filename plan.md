# Plan: Add Auth + Backend (Next.js) to Pomodoro Pro + Deploy to Vercel

## Overview

Convert the current Vite + React 19 SPA into a single Next.js 15 (App Router) application that hosts both the existing UI and the new API/Auth. Deploy to Vercel.

**Why a single app:** one repo, one deploy, one domain. No CORS, no cross-service env vars, no "API 404" surprises. The existing data layer is already centralized (`src/lib/local-data.ts` + TanStack Query hooks), so the migration to a real API only touches that one layer — the UI largely stays the same.

**Stack (confirmed):**
- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v3 + shadcn/ui
- Auth.js v5 (NextAuth) with Credentials provider (email + password, bcryptjs)
- Prisma ORM + Neon Postgres (serverless)
- Serwist (`@serwist/next`) for PWA
- TanStack Query (already in stack) for server state
- Zod for input validation
- Vercel for hosting

**Out of scope:** localStorage data migration (fresh start).

---

## Prerequisites

Create accounts / get credentials before starting:
1. **Neon** (https://neon.tech) — free Postgres project, copy **pooled** `DATABASE_URL` and **direct** `DIRECT_URL`
2. **GitHub** repo to push code to
3. **Vercel** account (sign in with GitHub)
4. Generate `AUTH_SECRET`: `openssl rand -base64 32`

---

## Phase 1 — Bootstrap the Next.js app

```bash
cd "E:\Development\Personal\CS50\Final Project (Pomodoro)"
npx create-next-app@latest pomodoro-pro \
  --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"
```

Then port the existing frontend code (no new project folder — work in the new `pomodoro-pro` dir going forward):

- Copy `src/components/**` → `pomodoro-pro/src/components/**`
- Copy `src/hooks/**` → `pomodoro-pro/src/hooks/**` *(will be edited in Phase 6)*
- Copy `src/lib/{format,sound,timer-worker,utils}.ts` → `pomodoro-pro/src/lib/**` *(skip `local-data.ts` — replaced by API)*
- Copy `src/types/index.ts` → `pomodoro-pro/src/types/index.ts` *(edit to drop the local `User` type in Phase 6)*
- Copy `src/store/timer-store.ts` → `pomodoro-pro/src/store/timer-store.ts` *(unchanged — pure client timer)*
- Copy `tailwind.config.ts`, `postcss.config.js`, `components.json` → `pomodoro-pro/`

Re-init shadcn in the new project (cleanest path):
```bash
cd pomodoro-pro
npx shadcn@latest init
npx shadcn@latest add button card input label dialog dropdown-menu avatar badge checkbox popover progress scroll-area select separator sheet slider switch tabs tooltip alert-dialog sonner
```
Then reuse the existing component JSX.

---

## Phase 2 — Convert routes to App Router

| Old (Vite + React Router) | New (Next.js App Router) |
|---|---|
| `src/App.tsx` (with `<Routes>`) | `app/layout.tsx` + `app/page.tsx` |
| `src/components/layout/app-shell.tsx` | `app/(app)/layout.tsx` (renders `<SidebarNav />`) |
| `src/pages/timer-page.tsx` | `app/(app)/timer/page.tsx` |
| `src/pages/tasks-page.tsx` | `app/(app)/tasks/page.tsx` |
| `src/pages/stats-page.tsx` | `app/(app)/stats/page.tsx` |
| `src/pages/settings-page.tsx` | `app/(app)/settings/page.tsx` |
| (new) | `app/(auth)/sign-in/page.tsx` |
| (new) | `app/(auth)/sign-up/page.tsx` |

- Delete `react-router-dom` from dependencies; use Next's `Link`, `useRouter`, `usePathname` instead.
- Add `<ThemeProvider>` (from `next-themes`) and `<QueryClientProvider>` (TanStack Query) to the root layout.
- `app/page.tsx` → `redirect('/timer')`.

---

## Phase 3 — Database setup

```bash
cd pomodoro-pro
npm i -D prisma
npm i @prisma/client bcryptjs
npm i -D @types/bcryptjs
npx prisma init
```

Add to `.env` (and Vercel env vars later):
```
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"   # pooled
DIRECT_URL="postgresql://...neon.tech/neondb?sslmode=require"     # direct (for migrations)
```

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())

  tasks    Task[]
  sessions PomodoroSessionLog[]
  settings AppSettings?
}

model Task {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title               String
  notes               String?
  estimatedPomodoros  Int      @default(1)
  completedPomodoros  Int      @default(0)
  isCompleted         Boolean  @default(false)
  position            Int
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  sessions PomodoroSessionLog[]

  @@index([userId, position])
}

model PomodoroSessionLog {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  taskId          String?
  task            Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)
  sessionType     String   // "work" | "shortBreak" | "longBreak"
  durationSeconds Int
  completedAt     DateTime @default(now())

  @@index([userId, completedAt])
}

model AppSettings {
  id                    String  @id @default(cuid())
  userId                String  @unique
  user                  User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  workDuration          Int     @default(25)
  shortBreakDuration    Int     @default(5)
  longBreakDuration     Int     @default(15)
  cyclesUntilLongBreak  Int     @default(4)
  autoStart             Boolean @default(false)
  soundEnabled          Boolean @default(true)
  volume                Int     @default(80)
  theme                 String  @default("system") // "light" | "dark" | "system"
  notificationsEnabled  Boolean @default(true)
  updatedAt             DateTime @updatedAt
}
```

Run migration:
```bash
npx prisma migrate dev --name init
```

Create `src/lib/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## Phase 4 — Auth.js v5 + Credentials

```bash
npm i next-auth@beta @auth/prisma-adapter zod
```

### `auth.config.ts` (edge-safe, no Prisma)
```ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  providers: [], // real providers in auth.ts (uses Prisma)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/sign-in") ||
                         nextUrl.pathname.startsWith("/sign-up");
      if (isAuthPage) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
```

### `auth.ts`
```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
```

### `middleware.ts`
```ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)"],
};
```

### `app/api/auth/[...nextauth]/route.ts`
```ts
export { GET, POST } from "@/auth";
```

### `app/api/auth/sign-up/route.ts`
Zod-validated `prisma.user.create({ data: { email, passwordHash: bcrypt.hash(password, 10) } })` then auto-sign-in via `signIn("credentials", …)`.

### `src/types/next-auth.d.ts`
Augment the session type so `session.user.id` is typed as `string`.

---

## Phase 5 — API route handlers

Every route file starts with:
```ts
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
export const runtime = "nodejs"; // Prisma is not Edge-compatible
```

| Method | Path | Behavior |
|---|---|---|
| POST | `/api/auth/sign-up` | Create user, hash password, return success |
| GET / PATCH | `/api/settings` | GET upserts a default row for the user; PATCH partial update |
| GET / POST | `/api/tasks` | GET list ordered by `position`; POST create with `position = max+1` |
| PATCH / DELETE | `/api/tasks/[id]` | Scoped to `userId`; PATCH partial; DELETE cascades sessions via FK |
| POST | `/api/tasks/reorder` | `prisma.$transaction` updating `position` for each id |
| GET / POST | `/api/sessions` | GET with `?from=&to=`; POST logs a completed session and increments `Task.completedPomodoros` in a transaction (only for `sessionType === "work"`) |
| GET | `/api/stats?period=day\|week\|month` | Server-side aggregation returning the **same** `StatsResponse` shape the charts already consume |

All inputs validated with Zod. All queries filtered by `session.user.id`.

### `src/lib/auth-helpers.ts`
```ts
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session.user;
}
```

---

## Phase 6 — Swap the data layer

### `src/lib/api-client.ts`
```ts
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(p: string)                    => request<T>(p),
  post:   <T>(p: string, body?: unknown)    => request<T>(p, { method: "POST", body: JSON.stringify(body) }),
  patch:  <T>(p: string, body?: unknown)    => request<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(p: string)                    => request<T>(p, { method: "DELETE" }),
};
```

### Edit each hook in `src/hooks/`
- `useTasks` → `queryFn: () => api.get<{ tasks: Task[] }>('/api/tasks')`
- `useCreateTask` → `mutationFn: (i) => api.post<Task>('/api/tasks', i)`
- `useUpdateTask`, `useDeleteTask`, `useReorderTasks` → same pattern
- `useLogSession` → `api.post('/api/sessions', input)`
- `useSettings`, `useUpdateSettings` → `api.get` / `api.patch` on `/api/settings`
- `useStats` → `api.get<StatsResponse>(\`/api/stats?period=\${period}\`)`

### `src/types/index.ts`
Drop the local `User` type — Auth.js provides it.

### Delete
- `src/lib/local-data.ts`
- `src/App.tsx`, `src/main.tsx`, `src/pages/*`
- `react-router-dom` from `package.json`
- `vite.config.ts`, `vite-plugin-pwa`

---

## Phase 7 — PWA via Serwist

```bash
npm i @serwist/next serwist
```

### `next.config.ts`
```ts
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

export default withSerwist({
  // your existing Next config
});
```

### `app/sw.ts`
```ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

### `app/manifest.ts`
Export a `MetadataRoute.Manifest` with the same name/icons/colors as the existing Vite manifest (icons already in `public/`).

---

## Phase 8 — Vercel deployment

### One-time Vercel setup
1. Push the repo to GitHub:
   ```bash
   git init && git add . && git commit -m "feat: next.js app with auth, api, pwa"
   git branch -M main
   git remote add origin https://github.com/<you>/pomodoro-pro.git
   git push -u origin main
   ```
2. In Vercel: **Add New Project → Import** the repo. Framework preset auto-detects as Next.js.

### Environment variables (Vercel project → Settings → Environment Variables)
Add for **Production** and **Preview**:

| Name | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://...neon.tech/neondb?sslmode=require` | **Pooled** connection string from Neon |
| `DIRECT_URL` | `postgresql://...neon.tech/neondb?sslmode=require` | Direct connection (for migrations) |
| `AUTH_SECRET` | (output of `openssl rand -base64 32`) | JWT signing secret |
| `AUTH_URL` | `https://<your-domain>.vercel.app` (prod) / `http://localhost:3000` (preview) | Set per env |

### `package.json` updates
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

### Apply migrations to production DB
Run once locally pointed at production `DATABASE_URL`:
```bash
DATABASE_URL="<prod-pooled>" DIRECT_URL="<prod-direct>" npx prisma migrate deploy
```
Or, simpler, change Vercel **Build Command** to `prisma migrate deploy && next build` for the first deploy only.

### Vercel config (optional `vercel.json`)
Not required for App Router. Defaults work.

---

## Files to create / edit / delete

### Create (~25 files)
- `app/layout.tsx`, `app/page.tsx`, `app/manifest.ts`, `app/sw.ts`
- `app/(app)/layout.tsx`, `app/(app)/{timer,tasks,stats,settings}/page.tsx`
- `app/(auth)/sign-in/page.tsx`, `app/(auth)/sign-up/page.tsx`
- `app/api/auth/[...nextauth]/route.ts`, `app/api/auth/sign-up/route.ts`
- `app/api/settings/route.ts`, `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`, `app/api/tasks/reorder/route.ts`, `app/api/sessions/route.ts`, `app/api/stats/route.ts`
- `auth.ts`, `auth.config.ts`, `middleware.ts`
- `prisma/schema.prisma`
- `src/lib/db.ts`, `src/lib/api-client.ts`, `src/lib/auth-helpers.ts`
- `src/types/next-auth.d.ts`

### Edit (~10 files)
- All 8 hooks in `src/hooks/`
- `src/types/index.ts` (drop local `User`)
- `next.config.ts` (wrap with `withSerwist`)
- `package.json` (deps + scripts)
- `.env` / `.env.example`

### Delete
- `src/lib/local-data.ts`
- `src/App.tsx`, `src/main.tsx`
- `src/pages/*` (entire folder)
- `react-router-dom` dependency
- `vite.config.ts`, `vite-plugin-pwa` (devDep)
- `index.html` (replaced by Next app shell)

---

## Verification

1. **Local:**
   ```bash
   npm run build && npm start
   ```
   Visit `http://localhost:3000`, sign up, sign in, create a task, complete a focus session, check Stats page.
2. **Vercel preview:** every PR gets a preview URL — confirm auth, CRUD, and stats work.
3. **Production:** promote the main branch after the preview passes smoke test.

---

## Risks & watch-outs

- **Next.js 15 + React 19 + TS 6 are bleeding edge** — expect occasional peer-dep warnings. Pin versions after `create-next-app`.
- **Prisma is not Edge-compatible** — every route handler touching Prisma needs `export const runtime = "nodejs"`. (If you ever want Edge, switch to Drizzle + `@neondatabase/serverless`.)
- **Server-side stats** is the biggest logic shift (moves from client to server). Keep the response shape identical so the Recharts components don't change.
- **PWA service workers** only register on HTTPS — Vercel provides this automatically.
- **Neon cold starts** are usually <1s on the free plan; the connection pooler (`-pooler`) URL avoids connection storms.
- **Pomodoro timer** stays purely client-side (Zustand + Web Worker) — only session *completion* is sent to the server, avoiding per-second round-trips.

---

## Execution order

1. Phase 1 — scaffold + port UI
2. Phase 2 — App Router routes
3. Phase 3 — DB + Prisma
4. Phase 4 — Auth.js v5
5. Phase 5 — API route handlers
6. Phase 6 — swap data layer (delete `local-data.ts`)
7. Phase 7 — Serwist PWA
8. Phase 8 — Vercel deploy + env vars + first prod migration
9. Verification
