# Deployment Guide

Pomodoro Pro is deployed as two independent services:

| Service  | Host    | Stack                    |
| -------- | ------- | ------------------------ |
| Frontend | Vercel  | Vite + React (static SPA) |
| Backend  | Railway | Flask + gunicorn         |
| Database | Neon    | PostgreSQL (pooled)      |

The frontend calls the backend over HTTPS with `credentials: "include"`, so cookies must be `Secure; SameSite=None`.

---

## 1. Backend on Railway

1. **Create a new project** at [railway.app/new](https://railway.app/new) → **Deploy from GitHub** → select `MubashshirK/pomodoro`.

2. **Settings → Service → Source**
   - **Root Directory:** `backend`
   - **Watch Paths:** `backend/**` (so frontend-only commits don't trigger redeploys)
   - **Start Command:** `gunicorn wsgi:application --bind 0.0.0.0:$PORT --workers 1 --timeout 30`
     - (or just leave the `Procfile` to be auto-detected)

3. **Variables** (Settings → Variables):
   ```
   DATABASE_URL=postgresql+pg8000://neondb_owner:npg_9IGOyU8WodPk@ep-plain-flower-apoe4if3-pooler.c-7.us-east-1.aws.neon.tech/neondb?ssl_context=true
   FLASK_SECRET_KEY=<run: python -c "import secrets; print(secrets.token_hex(32))">
   FLASK_ENV=production
   SESSION_COOKIE_SAMESITE=None
   SESSION_COOKIE_SECURE=True
   CORS_ORIGINS=https://pomodoro-pro-ten.vercel.app
   ```
   - Use the **pooled** Neon connection string (host contains `-pooler`).
   - `pg8000` requires `?ssl_context=true` (not `sslmode=require`).
   - `SESSION_COOKIE_SAMESITE=None` is required for cross-origin cookies (Vercel → Railway).
   - `CORS_ORIGINS` is comma-separated; add your dev origin too if you want to hit the prod backend from local.

4. **Generate a domain** (Settings → Networking → Public Networking → Generate Domain). Copy the URL — you'll paste it into Vercel in step 2. Format: `https://pomodoro-pro-backend.up.railway.app`.

5. **Verify:**
   ```bash
   curl https://<railway-domain>/api/health
   # → {"status":"ok"}
   ```

---

## 2. Frontend on Vercel

1. **Project** at [vercel.com/new](https://vercel.com/new) → Import `MubashshirK/pomodoro`.
   - Vercel auto-detects the Vite project. **Root Directory:** leave at repo root.
   - The `vercel-build` script in the root `package.json` runs `cd frontend && npm install && npm run build`.

2. **Environment Variables** (Settings → Environment Variables):
   ```
   VITE_API_BASE_URL = https://<railway-domain>
   ```
   - Apply to **Production** (and optionally Preview).
   - This is baked into the JS bundle at build time, so a redeploy is required after changing it.

3. **Delete the now-unused vars** that were used when the backend was on Vercel:
   - `DATABASE_URL`
   - `FLASK_SECRET_KEY`
   - `FLASK_ENV`

4. **Redeploy** (Deployments → ⋯ → Redeploy) so the new bundle is built with `VITE_API_BASE_URL`.

5. **Verify:** load `https://pomodoro-pro-ten.vercel.app`, register a user, start a focus session, refresh — the session should persist.

---

## 3. Local development

```bash
# One-time setup
npm run install:frontend   # installs frontend deps
npm run install:backend    # creates backend/.venv and installs requirements

# Terminal 1 — backend on :5000
npm run dev:backend
# (defaults to sqlite:///pomodoro.db, override with DATABASE_URL in backend/.env)

# Terminal 2 — frontend on :5173 (Vite proxies /api → :5000)
npm run dev:frontend
```

Vite's proxy in `frontend/vite.config.ts` forwards `/api/*` from `:5173` to `:5000`, so the frontend can use the same `/api` prefix locally and in production.

---

## 4. Cookies & CORS — why these settings matter

The frontend (`vercel.app`) and the backend (`railway.app`) are on **different origins**, so:

- **CORS:** the backend must echo the frontend's exact origin in `Access-Control-Allow-Origin`. Set `CORS_ORIGINS` on Railway to your Vercel URL. `*` is **not** allowed when `credentials: include` is used.
- **Cookies:** session cookies must be `SameSite=None; Secure` to be sent on cross-origin XHR/fetch. `Secure` requires HTTPS (both Vercel and Railway provide this). `Lax` would silently drop the cookie and every request would look unauthenticated.
- **Preflight:** the frontend sends `Content-Type: application/json`, which triggers a CORS preflight. The `flask-cors` defaults cover this once the origin is in the allow-list.

---

## 5. Rotating secrets (recommended)

The Neon connection string was committed (and later scrubbed) in early history. To be safe:

1. **Neon** → Project → Settings → Reset Database Password.
2. Update `DATABASE_URL` in Railway with the new value (host, user, and password all change).
3. **Optional but recommended:** invalidate all old sessions by rotating `FLASK_SECRET_KEY` on Railway. Existing users will be logged out.
