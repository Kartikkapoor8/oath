"""stage 0 — input validation and normalization. pure function, no api call."""

from prompts import VALID_MODES, VALID_VARIANTS
from voice_settings import VOICE_PRESET_MAP

LENGTH_LIMITS = {
    "intent": 100,
    "first_action": 80,
    "hero": 60,
    "phrase": 120,
}


def validate_and_normalize(inputs: dict) -> dict:
    """validate inputs and return a normalized copy."""
    out = dict(inputs)

    # required string fields
    for field in ("mode", "intent", "first_action", "hero", "phrase"):
        if field not in out or not isinstance(out[field], str):
            raise ValueError(f"input '{field}' is required and must be a string")
        out[field] = out[field].strip()
        if not out[field]:
            raise ValueError(f"input '{field}' cannot be empty after stripping whitespace")

    # length limits
    for field, limit in LENGTH_LIMITS.items():
        if len(out[field]) > limit:
            raise ValueError(
                f"input '{field}' is {len(out[field])} chars, exceeds limit of {limit}"
            )

    # mode normalization
    out["mode"] = out["mode"].lower()
    if out["mode"] not in VALID_MODES:
        raise ValueError(f"mode must be one of {VALID_MODES}, got: {out['mode']}")

    # variant
    out["variant"] = (out.get("variant") or "default").lower()
    if out["variant"] not in VALID_VARIANTS:
        raise ValueError(f"variant must be one of {VALID_VARIANTS}, got: {out['variant']}")

    # voice
    out["voice"] = (out.get("voice") or "the_closer").lower()
    if out["voice"] not in VOICE_PRESET_MAP:
        raise ValueError(
            f"voice must be one of {list(VOICE_PRESET_MAP.keys())}, got: {out['voice']}"
        )

    # hero: capitalize each word lightly (avoid mangling all-caps or middle-case inputs)
    if out["hero"] == out["hero"].lower():
        out["hero"] = " ".join(w.capitalize() for w in out["hero"].split())

    # target duration
    target = inputs.get("target_duration_seconds", 60)
    if not isinstance(target, int) or target < 30 or target > 120:
        target = 60
    out["target_duration_seconds"] = target

    return out
