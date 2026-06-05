# Pomodoro Pro

A modern, full-featured Pomodoro web app with task management, statistics, and
dark/light mode. CS50 Final Project — complete redesign.

## Stack

- **Frontend** — Vite 8 + React 19 + TypeScript 6 + Tailwind v3 + shadcn/ui (18 primitives) + Zustand + TanStack Query + next-themes + framer-motion + lucide-react + Recharts + sonner + @dnd-kit + vite-plugin-pwa
- **Backend** — Flask + SQLAlchemy + SQLite + Flask-Login
- **PWA** — installable, offline-capable

## Project Structure

```
backend/    Flask API (auth, tasks, sessions, stats, settings)
frontend/   Vite SPA (timer, tasks UI, stats charts, settings)
plan.md     Full implementation plan
```

## Quick Start (development)

You'll need two terminals.

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
flask --app app:create_app run --port 5000 --debug
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` to Flask on
port 5000.

## Status

🚧 **In development.** See `plan.md` for the full implementation roadmap.

Completed phases:
- **Phase 1** — Cleanup & scaffolding ✓
- **Phase 2** — Backend foundation (Flask app factory, CORS, SQLAlchemy,
  models for `User`/`Task`/`PomodoroSession`/`Settings`, Flask-Login,
  auth routes: register/login/logout/me) ✓
- **Phase 3** — Backend CRUD: tasks (list/create/get/update/delete/reorder),
  sessions (log/list, auto-increments task `completed_pomodoros`),
  settings (get/PUT with validation), stats (period=day|week|month with
  totals, by-type, per-day chart data, streak, top tasks) ✓
- **Phase 4** — Frontend design system: Vite 8 + React 19 + TS 6, Tailwind v3,
  shadcn/ui (18 primitives), Inter font, dark/light CSS variables (zinc base
  + work/short-break/long-break accents), `ThemeProvider` with system
  detection, `ModeToggle`, sonner toaster, Vite proxy `/api → :5000`,
  vite-plugin-pwa, `npm run build` produces 107 KB JS / 5.6 KB CSS gzipped ✓
- **Phase 5** — Layout + auth UI: API client (`lib/api.ts` with cookie
  credentials and 401 redirect), TanStack Query auth hooks (`useMe`,
  `useLogin`, `useRegister`, `useLogout`), shared `types/`, AppShell with
  sidebar + topbar + mobile Sheet, `ProtectedRoute` redirects to
  `/login?next=...`, `LoginPage` + `RegisterPage` (react-hook-form + zod),
  UserMenu (avatar + logout), placeholder pages for Tasks/Stats/Settings.
  Full E2E via Vite proxy verified: register → me → create task → logout → 401 ✓
- **Phase 6** — Timer feature: Web Worker `lib/timer-worker.ts` (drift-free
  `endTime - Date.now()` tick every 250ms), Zustand `timerStore` with
  `sessionType/status/totalMs/remainingMs/completedCycles/activeTask`,
  `useTimer` orchestrator (start/pause/resume/reset/skip + session-end
  transition + auto-start + sound + Web Notification + backend logging),
  `useKeyboardShortcuts` (`Space R S 1 2 3`, ignores inputs),
  `useNotificationPermission`, `SoundManager` with volume + mute, animated
  SVG `TimerRing` (framer-motion), `TimerDisplay`, `SessionTypeSwitch`,
  `TimerControls`, `ActiveTaskCard` with progress + task picker popover,
  `useTasks`/`useSettings`/`useLogSession` hooks, cycle counter, tab title
  `MM:SS — Session`, framer-motion session-type transitions.
  Worker correctly chunked by Vite (`timer-worker-*.js`), full E2E via
  Vite proxy verified: register → settings → all timer routes load. ✓
- **Phase 7** — Tasks feature: `useTasks` extended with `useCreateTask`,
  `useUpdateTask`, `useDeleteTask`, `useReorderTasks` mutations (toast on
  success/error), `TaskFormDialog` (rhf + zod, create/edit modes with
  title/notes/estimated_pomodoros fields and full reset on open),
  `TaskItem` (sortable: GripVertical drag handle, Checkbox, per-task
  Progress bar, "Focus" button / "Active" badge, DropdownMenu with
  Set as active/Edit/Delete, AlertDialog confirmation, isActive
  highlight via timer store), `TaskList` (DndContext + SortableContext
  with `verticalListSortingStrategy`, `closestCenter` collision
  detection, optimistic reorder via `useReorderTasks`),
  `TaskFilters` (Tabs: All/Active/Completed with live counts),
  `TaskEmptyState` (per-filter), `TasksPage` composed. Drag-to-reorder
  intentionally disabled in non-"All" filters to avoid partial position
  updates. Added shadcn `checkbox` and `alert-dialog` primitives.
  Typecheck clean; production build 753 KB JS / 35 KB CSS gzipped to
  233 / 6.8 KB. E2E via Vite proxy verified: register → create 3 tasks
  → reorder `[3,2,1]` → list shows correct order with positions
  0/1/2 → update task (title + is_completed + estimated_pomodoros) →
  delete task (200). ✓
- **Phase 8** — Stats feature: `humanizeSeconds` added to `lib/format.ts`,
  `useStats(period)` hook with 30s `staleTime`, `StatCard` (reusable
  icon + label + value + hint, tone classes for work/short/long break
  accents), `PeriodSelector` (Tabs: Today / 7 days / 30 days), `StreakCard`
  (Flame icon, empty-state copy when streak=0), `DailyBarChart` (Recharts
  BarChart of focus-minutes per day with rounded bars in `--work`,
  custom Tooltip showing minutes and humanized seconds), `SessionTypePie`
  (Recharts donut with side legend + percentages), `TaskLeaderboard`
  (top-5 with rank chips, progress bars, strikethrough on completed).
  `StatsPage` composes 4-up stat grid (Pomodoros / Focus time / Sessions /
  Streak), two-up chart row, and leaderboard. Loading skeletons on each
  card, error card with destructured error message, "Refreshing…" pill
  when refetch is in flight. Typecheck clean; production build 1.18 MB
  JS / 36 KB CSS gzipped to 346 / 6.9 KB (Recharts contributes most of
  the size). E2E via Vite proxy verified: register → create task → log
  3 work + 1 shortBreak sessions → `period=week` returns
  `total_pomodoros=3`, `total_focus_seconds=4500`, `current_streak=1`,
  `by_session_type={work:3, shortBreak:1, longBreak:0}`, 7 per-day
  entries, top task with 3/4 progress → `period=month` returns 30
  per-day entries → `period=day` returns 1 → `period=year` falls back
  to `week`. ✓
- **Phase 9** — Settings feature: `useUpdateSettings` mutation
  added to `use-settings.ts` (PUT `/api/settings`, optimistic cache
  update via `setQueryData`, invalidates `tasks` and `stats` so the
  duration changes flow through, success toast "Settings saved",
  error toast via `getErrorMessage`). `SettingsPage` rewritten with
  four Card sections (Timer / Behavior / Sound / Appearance), each
  field bound to `react-hook-form` + `zod` (full range validation
  matching backend: 1-180/1-60/1-120 minutes, 2-8 cycles, 0-100
  volume, theme enum). `DurationField` helper renders a `Slider` with
  a live `humanizeMinutes` value, accent-color labels for
  work/short/long. `SwitchRow` helper renders `Switch` with label +
  description. Theme picker is a `Select` (light/dark/system) that
  syncs to `ThemeProvider` immediately on change; the persisted value
  is committed on Save. On successful save, syncs the local
  `SoundManager` (mute + volume) and updates the global theme. Save
  button at top with `Loader2` spinner during mutation. Typecheck
  clean; production build 1.22 MB JS / 36 KB CSS gzipped to 359 / 6.9 KB.
  E2E via Vite proxy verified: register → GET returns backend defaults
  → PUT `{work_duration:30, short_break_duration:7, volume:50,
  sound_enabled:false, theme:"dark"}` returns 200 and only those
  fields change (long_break/cycles/auto_start/notifications unchanged)
  → 10 invalid cases all return 400 with backend error messages
  (work_duration=999 → "must be between 1 and 180", volume=150,
  theme="rainbow", auto_start="yes", cycles_until_long_break=1/9,
  long_break_duration=200, short_break_duration=100) → happy path
  with all 9 fields returns 200 and persists. ✓
- **Phase 10** — PWA polish + final QA: Generated PWA icons via
  Pillow (tomato-red rounded square + white ring + bold "P" with
  12-o'clock dot) — `pwa-192.png`, `pwa-512.png`,
  `pwa-maskable-512.png` (with 20% safe zone for adaptive icons),
  `apple-touch-icon.png` (180×180), `favicon-32.png`, and
  `favicon.ico` (multi-size 16/32/48). Updated `vite.config.ts` to
  bundle all icons via `includeAssets`, added `scope: "/"` and
  `purpose: "maskable"` to the manifest. New `InstallPrompt`
  component listens for `beforeinstallprompt`, shows a fixed
  bottom-of-screen card with Install + dismiss (persists dismissal
  in localStorage `pwa-install-dismissed`); cleaned up on
  `appinstalled`. Mounted at the App root. ESLint pass: fixed 5
  errors and 4 warnings — `theme-provider` split into
  `theme-provider.tsx` + `theme-context.ts` + `use-theme.ts` hook
  file (resolves `react-refresh/only-export-components`), shadcn
  `ui/*` files allowed to export `*Variants` helpers
  (config override), `use-timer.ts` callbacks reordered so the
  worker `useEffect` closes over already-declared `handleSessionComplete`
  / `advanceToNextSession` (no more TDZ), `tasks-page.tsx` wraps
  the data→tasks projection in `useMemo` for stable deps, and
  `settings-page.tsx` switches from `form.watch()` to RHF's
  `useWatch` (compatible with React Compiler memoization).
  `npm run lint` now passes with 0 errors / 0 warnings; production
  build 1.23 MB JS / 36 KB CSS gzipped to 359 / 7.0 KB; manifest
  is 0.44 kB. Full E2E sweep of 25 endpoints via Vite proxy all
  return expected status codes: auth (register 201 / dup 409 /
  me 200 / no-auth 401 / logout 200 / login 200 / wrong-pw 401),
  tasks (create×2 201 / empty-title 400 / get 200 / update 200 /
  reorder 200), sessions (work/shortBreak/longBreak 201 / bad-type
  400 / list 200), settings (get 200 / partial-put 200), stats
  (day/week/month/default all 200), health (200), delete (200 /
  404 / 200). ✓
- **Phase 11** — Account section: Backend adds `PUT /api/auth/password`
  (current + new password, ≥6 chars) and `DELETE /api/auth/me`
  (confirmation must match the user's email) — cascade-delete wipes
  the user's tasks, sessions, and settings via SQLAlchemy
  `cascade="all, delete-orphan"` on the User relationships. The
  `delete_account` handler re-fetches a fresh attached `User`
  instance via `User.query.get(int(current_user.get_id()))` before
  `logout_user()` so SQLAlchemy doesn't operate on a detached
  `LocalProxy`. Frontend adds `useChangePassword` and
  `useDeleteAccount` hooks, a `ChangePasswordDialog`
  (rhf+zod, current/new/confirm with show/hide eye toggle), and a
  destructive `DeleteAccountDialog` (typed email confirmation,
  redirect to `/register` on success). The sidebar footer is
  rewritten as a shadcn-style user block: expanded = full-width
  avatar+email row with chevron, collapsed = just the avatar —
  both open a dropdown containing: a `Theme` submenu (light/dark/
  system, current option checked, persists silently via
  `useUpdateSettings`), a Settings link (navigates to `/settings`),
  a Change password entry, a destructive Log out entry, and a
  destructive Delete account entry. The dialogs are co-located
  inside the dropdown trigger so state is local. The standalone
  `user-menu.tsx` (topbar-era) and `mode-toggle.tsx` are deleted
  (theme + user both live in the sidebar footer). E2E verified:
  register→change-pw (wrong-current 401 / correct 200 / login with
  new pw 200) → delete-account (wrong-confirmation 400 / correct
  200 / 401 after / cascaded task 404) and the original 16-endpoint
  regression sweep remains green. `npm run lint` 0 errors / 0
  warnings; production build 1.23 MB JS / 34 KB CSS gzipped 361 /
  6.87 KB. ✓

## Status

**Complete.** All 10 phases delivered, ESLint clean, full endpoint
sweep green, and the app is PWA-installable with proper icons.
