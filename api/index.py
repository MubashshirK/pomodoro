import logging
import sys
import traceback
from pathlib import Path

# Vercel captures `logging` output reliably, but if init fails
# the function is killed before any of that hits the logs, and
# Vercel returns a 500 with an empty body. To make the failure
# visible to the user (and to us, via the response), we register
# a `last-resort` WSGI app that serves a JSON error from the
# captured traceback, then assign it to `app` at the top level.

logging.basicConfig(
    level=logging.INFO,
    format="[%(name)s] %(levelname)s: %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("api.index")

_BACKEND = str(Path(__file__).resolve().parent.parent / "backend")
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

log.info("loaded; backend on sys.path: %s", _BACKEND)

_init_error: str | None = None

try:
    import importlib
    _app_module = importlib.import_module("app")
    _create_app = _app_module.create_app
    log.info("create_app imported")
    app = _create_app()
    log.info("Flask app created: %s", app)
except Exception:
    _init_error = traceback.format_exc()
    log.error("Flask app init failed:\n%s", _init_error)

    def app(environ, start_response):
        import json
        body = json.dumps({
            "error": "Server failed to start",
            "hint": "Check Vercel function logs for the full traceback.",
            "traceback": _init_error,
        }).encode("utf-8")
        status = "500 Internal Server Error"
        headers = [
            ("Content-Type", "application/json"),
            ("Content-Length", str(len(body))),
        ]
        start_response(status, headers)
        return [body]
