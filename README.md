# Pomodoro Pro

A modern, full-stack Pomodoro timer with task management, statistics, and themes. Built with Next.js 16, React 19, Prisma, and Auth.js.

![Pomodoro Pro](public/icon.svg)

## Features

- **Pomodoro Timer** — work / short break / long break cycles with customizable durations, auto-start option, and pause/resume/skip controls.
- **Task Management** — create, edit, complete, and reorder tasks. Assign a task to a focus session and track estimated vs. completed pomodoros.
- **Statistics** — daily bar chart, session-type pie chart, streak card, and a per-task leaderboard. Filter by day / week / month.
- **Settings** — adjust durations, sound, notification preferences, and theme (light / dark / system).
- **Authentication** — email + password sign-up / sign-in, plus a **guest mode** that creates a temporary account so you can try the app without registering.
- **PWA** — installable on iOS / Android / desktop with an offline page.
- **Dark Mode** — system-aware theme switching.
- **Responsive** — mobile-first layout with a slide-out sidebar and a single-viewport timer page.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16.2.7](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19.2.4](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com) |
| Components | [Radix UI](https://www.radix-ui.com) primitives + [shadcn/ui](https://ui.shadcn.com) patterns |
| State | [Zustand](https://zustand-demo.pmnd.rs) (timer), [TanStack Query v5](https://tanstack.com/query) (server state) |
| Auth | [Auth.js v5 (NextAuth)](https://authjs.dev) with Credentials provider |
| Database | [Prisma 6](https://www.prisma.io) + [Neon Postgres](https://neon.tech) (serverless) |
| Validation | [Zod](https://zod.dev) |
| Charts | [Recharts](https://recharts.org) |
| Animation | [framer-motion](https://www.framer.com/motion/) + [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) |
| PWA | [Serwist](https://serwist.pages.dev) (`@serwist/turbopack`) |
| Forms | [react-hook-form](https://react-hook-form.com) + Zod resolver |
| Icons | [lucide-react](https://lucide.dev) |
| Drag & Drop | [@dnd-kit](https://dndkit.com) |
| Fonts | [Inter](https://rsms.me/inter/) (UI) + [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (digits only, via unicode-range `@font-face`) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm, pnpm, or yarn
- A Postgres database (local or hosted). [Neon](https://neon.tech) free tier works great.

### 1. Clone & install

```bash
git clone https://github.com/MubashshirK/pomodoro.git
cd pomodoro
npm install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

```env
# Pooled connection (used at runtime)
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"

# Direct connection (used for migrations)
DIRECT_URL="postgresql://...neon.tech/neondb?sslmode=require"

# Generate with: openssl rand -base64 32
AUTH_SECRET="your-random-secret"

# Optional in dev; required in prod
AUTH_URL="http://localhost:3000"
```

### 3. Run migrations

```bash
npm run db:migrate
```

This creates the `User`, `Task`, `PomodoroSessionLog`, and `AppSettings` tables.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the sign-in page. Create an account or use **Continue as guest** to try the app without registering.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Generate Prisma client + build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Create / apply a new migration in dev |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:studio` | Open Prisma Studio (visual DB editor) |

## Project Structure

```
pomodoro/
├── prisma/
│   ├── schema.prisma          # User, Task, PomodoroSessionLog, AppSettings
│   └── migrations/
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated routes (timer, tasks, stats, settings)
│   │   ├── (auth)/            # Sign-in / sign-up
│   │   ├── api/               # Route handlers (REST API)
│   │   ├── icon.svg           # App icon (red gradient timer)
│   │   ├── manifest.json      # PWA manifest
│   │   ├── sw.ts              # Service worker (Serwist)
│   │   ├── layout.tsx         # Root layout (fonts, providers, metadata)
│   │   └── globals.css        # Tailwind v4 + custom @font-face
│   ├── components/
│   │   ├── layout/            # AppShell, Sidebar, UserMenu, PageContent
│   │   ├── timer/             # TimerDisplay, TimerRing, TimerControls, ActiveTaskCard
│   │   ├── tasks/             # TaskList, TaskFilters, TaskFormDialog
│   │   ├── stats/             # Charts, StatCard, StreakCard
│   │   └── ui/                # shadcn/ui primitives
│   ├── hooks/                 # TanStack Query hooks + timer + theme
│   ├── lib/                   # db, auth-helpers, api-client, format, sound
│   ├── store/                 # Zustand store (timer state)
│   └── types/                 # TypeScript types + next-auth augmentation
├── auth.ts                    # NextAuth instance
├── auth.config.ts             # Edge-safe NextAuth config
├── proxy.ts                   # Auth middleware (Next 16)
├── next.config.ts             # withSerwist wrapper
├── tailwind config (in CSS)   # Tailwind v4
└── package.json
```

## Database Schema

Four models with `Int` primary keys and cascading deletes:

- **User** — `email`, `passwordHash`, `name?`, `isGuest`
- **Task** — `title`, `notes?`, `estimatedPomodoros`, `completedPomodoros`, `isCompleted`, `position`
- **PomodoroSessionLog** — `sessionType`, `durationSeconds`, `completedAt`, `taskId?`
- **AppSettings** — `workDuration`, `shortBreakDuration`, `longBreakDuration`, `cyclesUntilLongBreak`, `autoStart`, `soundEnabled`, `volume`, `theme`, `notificationsEnabled`

## API Routes

All API routes are scoped to the authenticated user via `requireUser()` and run on the Node.js runtime (Prisma is not Edge-compatible).

| Method | Path | Description |
|---|---|---|
| `GET` / `POST` | `/api/auth/[...nextauth]` | NextAuth handler |
| `POST` | `/api/auth/sign-up` | Create account, auto sign-in |
| `POST` | `/api/auth/sign-in/guest` | Create guest account, auto sign-in |
| `GET` / `PATCH` | `/api/settings` | User settings (auto-upserted on GET) |
| `GET` / `POST` | `/api/tasks` | List / create tasks |
| `PATCH` / `DELETE` | `/api/tasks/[id]` | Update / delete a task |
| `POST` | `/api/tasks/reorder` | Reorder tasks (transactional) |
| `GET` / `POST` | `/api/sessions` | List / log sessions |
| `GET` | `/api/stats?period=day\|week\|month` | Aggregated stats |
| `DELETE` | `/api/user` | Delete account |
| `PATCH` | `/api/user/name` | Update display name |
| `PATCH` | `/api/user/password` | Change password (guests blocked) |

## Timer Architecture

The timer runs entirely on the client (Zustand store + a `setInterval` tick with a `Date.now()` end-time anchor). When a focus session completes, the client `POST`s a single record to `/api/sessions` — no per-second round-trips.

- **Drift-free**: uses wall-clock time, not accumulated ticks, so it stays accurate even when the tab is throttled.
- **Main-thread `setInterval`** (no Web Worker): Turbopack ships raw `.ts` as worker chunks in production, which `importScripts` can't parse. The main-thread approach is simple and reliable.
- **Cycle number** stays on the same cycle during breaks (work = `completedCycles % limit + 1`).

## Fonts

- **Inter** — loaded via `next/font/google` for all UI text.
- **JetBrains Mono** — loaded via a custom `@font-face` restricted by `unicode-range` to digits and time characters (`0-9`, `:`, `.`, `%`, `/`, `,`) so only numbers get the monospace treatment.

## PWA

Configured with Serwist. The service worker is built by `@serwist/turbopack` and served from `/serwist/sw.js`. The manifest references the SVG app icon. An offline page is shown when navigation fails.

## Deployment

### Vercel (recommended)

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new). Framework preset auto-detects as Next.js.
3. Add environment variables (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`).
4. For the **first deploy only**, change the build command to `prisma migrate deploy && next build` to apply migrations. Revert to `prisma generate && next build` afterwards.

### Other platforms

Any platform that supports Next.js + a long-running Node.js process will work. Make sure `DATABASE_URL` points to a pooled connection.

## License

MIT
