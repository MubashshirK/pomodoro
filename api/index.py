import sys
from pathlib import Path

_BACKEND = str(Path(__file__).resolve().parent.parent / "backend")
sys.path.insert(0, _BACKEND)

from app import create_app
app = create_app()
