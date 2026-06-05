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

_init_error: str | None = None

try:
    from app import create_app
    app = create_app()
    log.info("Flask app created: %s", app)
except Exception:
    _init_error = traceback.format_exc()
    log.error("Flask app init failed:\n%s", _init_error)
    sys.stderr.write(_init_error)
    sys.stderr.flush()

    def app(environ, start_response):
        import json
        body = json.dumps({
            "error": "Server failed to start",
            "traceback": _init_error,
        }).encode("utf-8")
        start_response("500 Internal Server Error", [
            ("Content-Type", "application/json"),
            ("Content-Length", str(len(body))),
        ])
        return [body]
