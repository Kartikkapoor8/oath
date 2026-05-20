"""shared env loader + json helpers for the v2 pipeline."""

import json
import os
from pathlib import Path
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
# override=True so .env.local wins over any stale empty values in the shell env.
load_dotenv(REPO_ROOT / ".env.local", override=True)


def require_anthropic_key() -> str:
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key or key.endswith("...") or len(key) < 20:
        raise RuntimeError(
            "ANTHROPIC_API_KEY missing or placeholder. "
            f"Edit {REPO_ROOT / '.env.local'} and paste a real key (starts with sk-ant-)."
        )
    return key


def require_elevenlabs_key() -> str:
    key = os.getenv("ELEVENLABS_API_KEY", "")
    if not key or key.endswith("...") or len(key) < 20:
        raise RuntimeError(
            "ELEVENLABS_API_KEY missing or placeholder. "
            f"Edit {REPO_ROOT / '.env.local'} and paste a real key."
        )
    return key


def strip_json_fences(raw: str) -> str:
    """remove ```json / ``` fences if claude wraps the response."""
    s = raw.strip()
    if s.startswith("```"):
        lines = s.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        s = "\n".join(lines).strip()
    return s


def parse_json_response(raw: str) -> dict:
    return json.loads(strip_json_fences(raw))
