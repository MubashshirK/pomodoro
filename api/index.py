import logging
import sys
import traceback
from pathlib import Path

# Vercel captures `logging` (not raw `print`) reliably.
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

# Import `create_app` under a private alias to avoid colliding with
# the `app` symbol that Vercel's Python entrypoint detector scans for.
import importlib
_app_module = importlib.import_module("app")
_create_app = _app_module.create_app
log.info("create_app imported")

app = _create_app()
log.info("Flask app created: %s", app)
