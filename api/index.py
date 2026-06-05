import sys
import traceback
from pathlib import Path

# Vercel's Python runtime installs deps from the project root's
# `requirements.txt` and looks for a module-level `app` symbol here.
# We re-export the Flask app from `backend/`.

_BACKEND = str(Path(__file__).resolve().parent.parent / "backend")
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

try:
    from app import create_app  # noqa: E402
    app = create_app()
except Exception:
    # If anything goes wrong during import or app construction, return a
    # JSON error to the client AND log the full traceback to stderr
    # (Vercel captures stderr in the function logs). This replaces the
    # opaque "500 with empty body" so the failure is debuggable.
    traceback.print_exc()
    sys.stderr.write("\n--- api/index.py failed during create_app() ---\n")
    traceback.print_exc(file=sys.stderr)

    def app(environ, start_response):
        status = "500 Internal Server Error"
        body = b'{"error":"Server failed to start. Check Vercel function logs."}'
        headers = [
            ("Content-Type", "application/json"),
            ("Content-Length", str(len(body))),
        ]
        start_response(status, headers)
        return [body]
