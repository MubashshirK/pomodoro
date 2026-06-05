import sys
import traceback
from pathlib import Path

# Vercel's Python runtime installs deps from the project root's
# `requirements.txt` and looks for a module-level `app` symbol here.
# We re-export the Flask app from `backend/`.

_BACKEND = str(Path(__file__).resolve().parent.parent / "backend")
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

print(f"[api/index.py] loaded; backend on sys.path: {_BACKEND}", file=sys.stderr)

create_app = None
try:
    from app import create_app  # noqa: E402
    print("[api/index.py] create_app imported OK", file=sys.stderr)
except Exception:
    print("[api/index.py] FAILED to import create_app:", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)

_app = None
if create_app is not None:
    try:
        _app = create_app()
        print(f"[api/index.py] Flask app created: {_app}", file=sys.stderr)
    except Exception:
        print("[api/index.py] FAILED in create_app():", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)

if _app is None:
    def _fallback(environ, start_response):
        status = "500 Internal Server Error"
        body = b'{"error":"Server failed to start. Check Vercel function logs."}'
        headers = [
            ("Content-Type", "application/json"),
            ("Content-Length", str(len(body))),
        ]
        start_response(status, headers)
        return [body]
    _app = _fallback

# MUST be at module top level for Vercel's Python detector.
app = _app
