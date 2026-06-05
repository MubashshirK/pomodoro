# Pomodoro Pro — Implementation Plan

A complete redesign of the CS50 Pomodoro project into a full-featured, modern
Pomodoro web app with task management, statistics, dark/light theming, and PWA
support.

---

## Goals

- Replace the vanilla JS/Flask-templated app with a clean, modern stack.
- Deliver a feature-complete Pomodoro experience: timer, tasks, stats, settings.
- Support authenticated multi-user data with a Flask API + SQLite.
- Installable PWA, dark/light mode, smooth motion, full keyboard support.

## Tech Stack

**Backend** — Flask, Flask-CORS, Flask-SQLAlchemy, Flask-Login, Werkzeug,
python-dateutil, SQLite.

**Frontend** — Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui,
react-router-dom, Zustand, TanStack Query, next-themes, framer-motion,
lucide-react, Recharts, sonner, date-fns, @dnd-kit/core, @dnd-kit/sortable,
vite-plugin-pwa.

**Auth** — Email + password via Flask-Login (session cookies), Werkzeug
password hashing, server-side session scoping per user.

---

## High-Level Architecture

```
backend/      Flask + SQLAlchemy + SQLite (JSON API only, no templates)
frontend/     Vite + React + TS + Tailwind + shadcn/ui (SPA)
```

- Vite dev server runs on `:5173` and proxies `/api/*` to Flask on `:5000`.
- Timer logic runs client-side in a Web Worker for drift-free accuracy.
- Completed Pomodoro sessions are logged to the API; tasks and stats are
  scoped to the logged-in user.
- Old `templates/`, `static/`, original `app.py`, and `Video Demo/` are
  removed. The 4 MP3 sound files are copied into `frontend/public/sounds/`.

---

## Database Models

```
User              id, email (unique), password_hash, created_at
Task              id, user_id (FK), title, notes,
                  estimated_pomodoros, completed_pomodoros,
                  is_completed, position, created_at
PomodoroSession   id, user_id (FK), task_id? (FK), session_type,
                  duration_seconds, completed_at
Settings          id, user_id (FK, unique), work_duration,
                  short_break_duration, long_break_duration,
                  cycles_until_long_break, auto_start,
                  sound_enabled, volume, theme
```

`Settings` is one row per user, auto-created on first access with sensible
defaults (25/5/15 minutes, 4 cycles, dark theme, sounds on, auto-start off).

---

## API Surface

| Method | Path                 | Auth | Purpose                          |
|--------|----------------------|------|----------------------------------|
| POST   | /api/auth/register   | no   | Create account                  |
| POST   | /api/auth/login      | no   | Start session                   |
| POST   | /api/auth/logout     | yes  | End session                     |
| GET    | /api/auth/me         | yes  | Current user                    |
| GET    | /api/tasks           | yes  | List tasks                      |
| POST   | /api/tasks           | yes  | Create task                     |
| PUT    | /api/tasks/<id>      | yes  | Update task                     |
| DELETE | /api/tasks/<id>      | yes  | Delete task                     |
| POST   | /api/tasks/reorder   | yes  | Persist new order               |
| GET    | /api/sessions        | yes  | List completed sessions         |
| POST   | /api/sessions        | yes  | Log a completed session         |
| GET    | /api/stats?period=   | yes  | Aggregations (day/week/month)   |
| GET    | /api/settings        | yes  | Read settings                   |
| PUT    | /api/settings        | yes  | Save settings                   |

All authenticated endpoints scope results by `current_user.id`. 401 responses
trigger a frontend redirect to `/login` and a TanStack Query cache purge.

---

## Frontend Routes

| Path       | Page           | Auth     |
|------------|----------------|----------|
| /login     | LoginPage      | public   |
| /register  | RegisterPage   | public   |
| /          | TimerPage      | required |
| /tasks     | TasksPage      | required |
| /stats     | StatsPage      | required |
| /settings  | SettingsPage   | required |

---

## Visual Design (Modern Minimal)

- Inter font (400/500/600/700), generous line-height, large numerals for the timer.
- `bg-card` surfaces with `rounded-2xl`, soft `shadow-sm`, 1px hairline border.
- Accent colors (CSS variables, available in both themes):
  - Work        -> `hsl(0 72% 55%)`  (tomato)
  - Short Break -> `hsl(200 90% 55%)` (sky)
  - Long Break  -> `hsl(265 80% 65%)` (violet)
- Dark theme: zinc-950 background, zinc-900 cards, elevated surfaces.
- Light theme: white background, zinc-50 cards, hairline zinc-200 borders.
- Sidebar nav (240px) on `>=md`; mobile collapses to a shadcn `Sheet`.
- framer-motion for page transitions, button presses, ring completion,
  dialog open/close. `prefers-reduced-motion` respected.
- lucide-react icons throughout.
- sonner toasts (top-right) for session complete, task added, settings saved.

---

## Feature Details

### Timer (Web Worker-driven)

- `lib/timer-worker.ts` runs a single `setInterval` posting `{remainingMs}`
  every 250ms. The main thread renders.
- Remaining time is computed from `endTime - Date.now()` so the value
  stays correct across worker restarts and tab throttling.
- On `remainingMs <= 0` the worker posts completion; the main thread plays
  the appropriate sound, fires a Web Notification (if permitted + enabled),
  shows a toast, and logs the session via `POST /api/sessions`.
- Tab title format: `MM:SS — Focus · Pomodoro Pro`.
- Keyboard shortcuts:
  - `Space` toggle start/pause
  - `R` reset current session
  - `S` skip to next session
  - `1`/`2`/`3` switch session type (only when idle)
- Sound files: reuse the 4 MP3s from the original project.

### Tasks (DnD)

- shadcn `Dialog` for create/edit; `DropdownMenu` for delete.
- Filter tabs: All / Active / Completed.
- `@dnd-kit/sortable` list with a drag handle on the left of each item.
- `position` is a float; on drop we recompute order and call
  `POST /api/tasks/reorder` with the new array.
- "Focus on this" sets `activeTaskId` in the timer store; the timer's
  Active Task card reflects it. Completing a work session increments the
  task's `completed_pomodoros`, visualized as a small progress bar per task.

### Stats

- Recharts `BarChart` (pomodoros per day) and `PieChart` (time split by
  session type).
- Streak: longest run of consecutive days with at least one completed
  work session, computed server-side.
- Top-5 task leaderboard by completed pomodoros.
- Period selector (Day / Week / Month) updates the query key.

### Settings

- shadcn `Slider` for cycles-until-long-break (2-8) and volume (0-100).
- `Switch` for auto-start, sounds, browser notifications.
- `Input type=number"` for durations.
- Save with optimistic update via TanStack Query; rollback on error.

### PWA

- `vite-plugin-pwa` with autoUpdate registration.
- Web manifest with two icon sizes, theme color, `display: standalone`.
- Precache the app shell, runtime-cache Google Fonts.
- Install prompt button in the top bar, hidden once installed or dismissed.

---

## File Tree

```
backend/
  app.py
  models.py
  database.py
  requirements.txt
  routes/
    __init__.py
    auth.py
    tasks.py
    sessions.py
    stats.py
    settings.py
  instance/
    pomodoro.db

frontend/
  index.html
  package.json
  tsconfig.json
  tsconfig.node.json
  tailwind.config.ts
  postcss.config.js
  vite.config.ts
  components.json
  public/
    manifest.webmanifest
    pwa-192.png
    pwa-512.png
    favicon.svg
    sounds/
      work-start.mp3
      break-start.mp3
      resume-session.mp3
      session-end.mp3
  src/
    main.tsx
    App.tsx
    index.css
    vite-env.d.ts
    lib/
      api.ts
      utils.ts
      format.ts
      timer-worker.ts
    hooks/
      useTimer.ts
      useKeyboardShortcuts.ts
      useNotify.ts
    store/
      timerStore.ts
      uiStore.ts
    components/
      ui/                          # shadcn primitives
      layout/
        AppShell.tsx
        SidebarNav.tsx
        TopBar.tsx
        MobileNav.tsx
        ProtectedRoute.tsx
      timer/
        TimerRing.tsx
        TimerDisplay.tsx
        SessionTypeSwitch.tsx
        TimerControls.tsx
        ActiveTaskCard.tsx
      tasks/
        TaskList.tsx
        TaskItem.tsx
        TaskFormDialog.tsx
        TaskFilters.tsx
      stats/
        StatCard.tsx
        DailyBarChart.tsx
        SessionTypePie.tsx
        StreakCard.tsx
        TaskLeaderboard.tsx
      settings/
        DurationCard.tsx
        BehaviorCard.tsx
        SoundCard.tsx
        ThemeCard.tsx
    pages/
      LoginPage.tsx
      RegisterPage.tsx
      TimerPage.tsx
      TasksPage.tsx
      StatsPage.tsx
      SettingsPage.tsx
    types/
      index.ts

.gitignore
README.md
```

---

## Implementation Phases

| #  | Phase              | Key deliverables                                                                                 |
|----|--------------------|--------------------------------------------------------------------------------------------------|
| 1  | Cleanup + scaffold | Remove old files, create `backend/` and `frontend/`, root `.gitignore`, top-level `README.md`.   |
| 2  | Backend foundation | Flask app factory, CORS, SQLAlchemy, models, Flask-Login, auth routes (register/login/logout/me).|
| 3  | Backend CRUD       | Tasks (incl. reorder), sessions, settings, stats endpoints with per-user scoping.                |
| 4  | Frontend design    | Vite TS init, Tailwind, shadcn init, primitives installed, dark/light variables, next-themes, Inter.|
| 5  | Layout + auth UI   | AppShell, SidebarNav, TopBar, MobileNav, Router, Login/Register pages, ProtectedRoute, API client.|
| 6  | Timer feature      | timerWorker, useTimer, timerStore, TimerRing, SessionTypeSwitch, TimerControls, ActiveTaskCard, shortcuts, tab title, notifications, session logging.|
| 7  | Tasks feature      | TaskList, TaskItem, TaskFormDialog, TaskFilters, dnd-kit reorder, active-task integration.        |
| 8  | Stats feature      | StatCard, DailyBarChart, SessionTypePie, StreakCard, TaskLeaderboard, period selector.            |
| 9  | Settings feature   | All settings cards with optimistic updates and backend sync.                                       |
| 10 | PWA + polish       | vite-plugin-pwa, manifest, icons, install prompt, loading/empty states, error boundary, framer-motion, a11y pass, focus rings, reduced-motion.|
| 11 | Docs + scripts     | Top-level README with setup, dev commands (two terminals or `concurrently`), architecture notes.|

---

## Verification Plan

- `flask run` (or `python -m flask`) boots cleanly; `curl` smoke tests for
  auth -> tasks -> sessions -> stats -> settings succeed.
- `npm run dev` boots Vite; the timer counts down across pause/resume; the
  tab title updates.
- DevTools CPU throttle 6x -> timer still accurate (Web Worker proof).
- Theme toggle -> smooth transition, no flash on reload.
- Lighthouse PWA audit >= 90, accessibility >= 95.
- All keyboard shortcuts work; Tab order is logical; focus is visible.

---

## What Gets Removed

- `app.py` (original, replaced)
- `templates/index.html`
- `static/` folder (the 4 MP3s move to `frontend/public/sounds/`)
- `Video Demo/Pomodoro_by_mubashshir.mp4` (25MB - linked from README)
- Original `README.md` (rewritten)

## What Gets Preserved

- The 4 MP3 sound files
- Git history
