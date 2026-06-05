import logging
import sys
import traceback
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="[%(name)s] %(levelname)s: %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("api.index")

_BACKEND = str(Path(__file__).resolve().parent.parent / "backend")
sys.path.insert(0, _BACKEND)

log.info("loaded; backend on sys.path: %s", _BACKEND)

# Vercel's Python runtime scans the entrypoint with a static AST pass
# and requires a top-level `app` / `application` / `handler` WSGI
# callable. Earlier versions defined `app` only inside try/except
# blocks (indentation 4) and the analyzer missed it -> "Could not find
# a top-level app" build error.
#
# Hoist `app` to module scope (indentation 0) so the analyzer sees
# it. _init() populates it with the real Flask app if import works;
# otherwise we point `app` at the _fallback WSGI app below.
app = None
_init_error = None


def _init():
    global app, _init_error
    try:
        from app import create_app

        app = create_app()
        log.info("Flask app created: %s", app)
    except Exception:
        _init_error = traceback.format_exc()
        log.error("Flask app init failed:\n%s", _init_error)
        sys.stderr.write(_init_error)
        sys.stderr.flush()


_init()


def _fallback(environ, start_response):
    import json

    body = json.dumps(
        {
            "error": "Server failed to start",
            "traceback": _init_error,
        }
    ).encode("utf-8")
    start_response(
        "500 Internal Server Error",
        [
            ("Content-Type", "application/json"),
            ("Content-Length", str(len(body))),
        ],
    )
    return [body]


if app is None:
    app = _fallback
