# Pomodoro Pro

A modern Pomodoro web app with task management, statistics, and
dark/light mode. CS50 Final Project.

## Stack

- **Frontend** — Vite 8 + React 19 + TypeScript 6 + Tailwind v3 + shadcn/ui (18 primitives) + Zustand + TanStack Query + next-themes + framer-motion + lucide-react + Recharts + sonner + @dnd-kit + vite-plugin-pwa
- **Storage** — Browser `localStorage` (no backend)
- **PWA** — installable, offline-capable

## Quick Start (development)

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. All data is stored locally in your browser.

## Scripts

- `npm run dev` — Vite dev server with HMR
- `npm run build` — typecheck (`tsc -b`) + production build to `dist/`
- `npm run preview` — preview the production build
- `npm run lint` — ESLint

## Build & Deploy

```bash
npm install
npm run build
```

The production build lands in `dist/` and is a static bundle you can serve
from any static host (Vercel, Netlify, GitHub Pages, S3, etc.). No backend
or environment variables required.

## Features

- **Timer** — drift-free Web Worker countdown, work / short break / long break cycles, auto-start, browser notifications, sound effects, keyboard shortcuts (`Space` play/pause, `R` reset, `S` skip, `1/2/3` switch session).
- **Tasks** — create, edit, delete, drag-to-reorder, filter (all/active/completed), pin a task to the active timer card.
- **Stats** — Today / 7 days / 30 days. Pomodoros, focus time, session breakdown, daily bar chart, session-type donut, top-5 task leaderboard, current streak.
- **Settings** — work/short/long break durations, cycle length, auto-start, sound + volume, theme (light/dark/system), browser notifications.
- **PWA** — installable, offline-capable via service worker, with maskable + apple-touch icons.
- **Theme** — system / light / dark with persisted preference.

## Data

All data (tasks, sessions, settings) lives in `localStorage` under the
key `pomodoro-local-data-v1`. Clearing site data resets the app.
