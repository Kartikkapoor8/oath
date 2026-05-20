"""stage 7 — prosody markup.

inserts elevenlabs-compatible `<break time="X.Xs" />` tags between major beats
and around emphasis points. pure python, no api call. mode-specific tuning
shapes the pause cadence.

elevenlabs v2.5 flash supports <break time="..." /> as inline ssml. break
durations must be sub-3s per their guidance to avoid degraded audio quality.
"""

import re

# mode-specific pause durations (seconds)
MODE_PROSODY = {
    "hardest_work": {
        "major_pause": 1.5,    # between major beats (groggy → intent → hero → grounding → command)
        "minor_pause": 0.7,    # between command verbs
        "grounding_pause": 1.5,  # before/after grounding phrase
        "hero_pause": 1.0,     # after hero anchor lands
    },
    "gym_now": {
        "major_pause": 0.8,    # tighter rhythm
        "minor_pause": 0.4,
        "grounding_pause": 0.8,
        "hero_pause": 0.6,
    },
    "grounding_phrases": {
        "major_pause": 2.5,    # long pauses around the phrase — liturgical
        "minor_pause": 1.0,
        "grounding_pause": 2.5,
        "hero_pause": 1.5,
    },
}


def _pause(seconds: float) -> str:
    """format a break tag with safe sub-3s duration."""
    s = max(0.3, min(2.8, seconds))
    # elevenlabs accepts s or ms; use s with 1 decimal place
    return f'<break time="{s:.1f}s" />'


def _find_grounding_lines(script: str, phrase: str) -> set:
    """return the set of line indices where the grounding phrase appears (case-insensitive substring)."""
    out = set()
    p = phrase.lower().strip().rstrip(".,!?")
    if not p:
        return out
    for i, line in enumerate(script.split("\n")):
        if p in line.lower():
            out.add(i)
    return out


def add_prosody_markup(script: str, mode: str, grounding_phrase: str = "") -> str:
    """add elevenlabs break tags between beats based on the script's structural arc.

    strategy: insert a major-pause break tag after blank-line beat separators.
    add grounding pauses specifically around lines containing the grounding phrase.
    add minor pauses between chained command verbs (consecutive single-verb lines).

    pure python, deterministic.
    """
    if not script.strip():
        return script

    settings = MODE_PROSODY.get(mode, MODE_PROSODY["hardest_work"])
    lines = script.split("\n")
    grounding_indices = _find_grounding_lines(script, grounding_phrase) if grounding_phrase else set()

    out_lines: list = []
    prev_blank = False
    for i, raw_line in enumerate(lines):
        stripped = raw_line.strip()
        is_blank = stripped == ""

        if is_blank:
            # consecutive blanks collapse to one major pause marker
            if not prev_blank:
                # decide pause type based on neighboring content
                # if the next non-blank line contains the grounding phrase, use grounding_pause
                next_idx = next((j for j in range(i + 1, len(lines)) if lines[j].strip()), -1)
                prev_idx = next((j for j in range(i - 1, -1, -1) if lines[j].strip()), -1)
                is_grounding_neighbor = next_idx in grounding_indices or prev_idx in grounding_indices
                pause = settings["grounding_pause"] if is_grounding_neighbor else settings["major_pause"]
                out_lines.append(_pause(pause))
            prev_blank = True
            continue

        # short single-word imperative line (e.g., "Write.", "Begin.", "Open.")
        # gets a small inter-command pause if the previous output line was also short
        is_short_command = len(stripped.split()) <= 2 and stripped.endswith((".", "!"))
        if is_short_command and out_lines and not out_lines[-1].startswith("<break"):
            prev_text = out_lines[-1].strip()
            if len(prev_text.split()) <= 3 and prev_text.endswith((".", "!")):
                out_lines.append(_pause(settings["minor_pause"]))

        out_lines.append(raw_line)
        prev_blank = False

    return "\n".join(out_lines)


def count_break_tags(text: str) -> int:
    return len(re.findall(r"<break\s+time=", text))
