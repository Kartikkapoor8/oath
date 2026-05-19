"""generate_script.py — OATH ritual script generation.

composes a three-layer system prompt (identity + mode + variant overlay) and asks
claude sonnet 4.6 to produce a 130-200 word audio ritual script. validates word
count and banned phrases, retries once on either failure.
"""

import os
import json
import hashlib
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

from anthropic import Anthropic
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
# override=True so .env.local wins over any stale empty values in the shell env.
load_dotenv(REPO_ROOT / ".env.local", override=True)

# sonnet 4.6 is the right tier here: opus is overkill and slow, haiku lacks emotional muscle.
# if 4-6 returns 404 in the future, try claude-sonnet-4-5 as fallback.
MODEL_ID = "claude-sonnet-4-6"
MAX_TOKENS = 800
TEMPERATURE = 0.7
WORDS_PER_SECOND = 2.5  # ~150 wpm at elevenlabs flash v2.5 default pace

VALID_MODES = ("hardest_work", "gym_now", "grounding_phrases")
VALID_VARIANTS = ("default", "more_clipped", "more_narrative", "hero_anchor_heavy", "grounding_heavy")

BANNED_PHRASES = [
    "rise and grind",
    "champion",
    "you got this",
    "you can do it",
    "let's go",
    "let's gooo",
    "today is a new day",
    "today is your day",
    "your future self will thank you",
    "rise up",
    "wake up and conquer",
    "endorphins",
    "you'll feel great",
    "mindfulness",
    "presence",
    "be here now",
    "channel your inner",
    "as kobe said",
    "as goggins said",
    "as jordan said",
]

LAYER_1 = """You are writing a morning ritual script for OATH, an app that plays a personalized 45-90 second audio piece the moment a user dismisses their morning alarm.

The user is in bed, half-awake, vulnerable, one thumb from TikTok. Your script has to be a better choice than the feed. You have 130 to 200 words to get them out of bed and into their hardest task.

This is not a motivational speech. It is a ritual. It is spare, specific, and physical. It speaks the user's exact commitment back to them. It does not flatter. It does not console. It commands.

Banned phrases (using any of these is a hard failure — do not use these words or phrasings in any form):
- "rise and grind"
- "champion"
- "you got this"
- "you can do it"
- "let's go" / "let's gooo"
- "today is a new day"
- "today is your day"
- "your future self will thank you"
- "rise up"
- "wake up and conquer"
- "endorphins"
- "you'll feel great"
- "mindfulness"
- "presence"
- "be here now"
- "channel your inner [anyone]"
- any direct quote attributed to a real person (e.g. "as kobe said...")
- any rhetorical question (no question marks in the output)

Reference heroes by their concrete habits — a specific time, a specific number, a specific place — never by invented quotes or generic platitudes about excellence."""

MODE_PROMPTS = {
    "hardest_work": """Mode: HARDEST WORK FIRST.

Tone: clipped, declarative, professional but emotionally charged. Short sentences. Verbs over adjectives.

Structural arc (must hit in order):
1. Groggy reality (1 line). Acknowledge what time it is or that they just woke up.
2. Quote the user's intent verbatim. Use the phrase "you swore" or "you said" to anchor to the night-before commitment.
3. The hero anchor — a concrete habit (4am, empty room, no audience, specific number of reps or hours). Not a quote. Not a platitude.
4. The grounding phrase, verbatim, in its own beat.
5. A time-boxed runway and physical instruction ("forty-five minutes. phone face down.").
6. The command. Single verb. Period. No question.""",

    "gym_now": """Mode: GYM NOW.

Tone: kinetic, charged, physically energizing. Short sentences. Imperatives at the body, not the mind.

Structural arc (must hit in order):
1. A body cue. A physical action the user should be doing while listening ("up. shorts on. water.").
2. The hero anchor — a physical habit at an extreme time (kobe at 4am, jordan's 500 free throws, goggins' miles). Concrete and specific.
3. Quote the user's intent verbatim. Their committed first action goes here.
4. The grounding phrase, verbatim.
5. The command. A door, a rep count, a route. Single physical action.

Bans specific to this mode:
- No "endorphins" or "you'll feel great"
- No "your future self will thank you"
- No long-term benefit framing — at 6am only the next 5 minutes exist""",

    "grounding_phrases": """Mode: GROUNDING PHRASES.

Tone: spare, repetition-heavy, almost liturgical. Low affect, high weight. Silence is content — use line breaks as pauses.

Structural arc:
1. The grounding phrase, alone on its own line.
2. A short beat (line break).
3. The grounding phrase, again. Same words.
4. Another short beat.
5. The user's intent verbatim. Spoken once, slowly.
6. The grounding phrase, one more time.
7. The command. Single verb.

Specific rules for this mode:
- Do not explain the phrase. Do not paraphrase it. The moment you explain it, it stops being the user's.
- The hero is OPTIONAL in this mode. If used, only as a single concrete moment in one beat between phrase repetitions. Default to omitting the hero entirely if the phrase is strong.
- Pauses are part of the script. Use line breaks generously.""",
}

VARIANT_OVERLAYS = {
    "default": "",
    "more_clipped": """Variant: MORE CLIPPED.
Make every sentence shorter. Cut every word that isn't load-bearing. Aim for 130 words, not 200. Imperatives only. No adverbs.""",

    "more_narrative": """Variant: MORE NARRATIVE.
Allow one or two slightly longer story-shaped beats, especially in the hero anchor. The hero moment can be 2-3 sentences instead of 1. Stay within 200 words total. Do not become a speech.""",

    "hero_anchor_heavy": """Variant: HERO ANCHOR HEAVY.
The hero anchor expands to 3-4 sentences with vivid concrete detail — time, place, number, scene. Still no invented quotes. The anchor should feel like a documentary clip, not a quote-stitched motivational poster.""",

    "grounding_heavy": """Variant: GROUNDING HEAVY.
Repeat the user's grounding phrase 3 times across the script (instead of once). Slow the cadence overall. Use more line breaks. The phrase carries the script.""",
}


def build_system_prompt(mode: str, variant: str) -> str:
    parts = [LAYER_1, MODE_PROMPTS[mode]]
    overlay = VARIANT_OVERLAYS.get(variant, "")
    if overlay.strip():
        parts.append(overlay)
    return "\n\n".join(parts)


def build_user_prompt(
    mode: str,
    variant: str,
    intent: str,
    first_action: str,
    hero: str,
    grounding_phrase: str,
    target_duration_seconds: int,
) -> str:
    target_word_count = int(target_duration_seconds * WORDS_PER_SECOND)
    return f"""Generate the OATH ritual script using:

mode: {mode}
variant: {variant}
user's intent (the hardest task they swore last night they'd tackle this morning): "{intent}"
user's first action (what they'll do in the first 5 minutes): "{first_action}"
user's hero (reference by concrete habit, never by invented quote): {hero}
user's grounding phrase (use verbatim, do not paraphrase): "{grounding_phrase}"

Target read duration: {target_duration_seconds} seconds (~{target_word_count} words at 150 wpm).

Output as JSON:
{{
  "script": "the spoken text, with line breaks for natural pauses",
  "estimated_duration_seconds": <integer>,
  "word_count": <integer>
}}

Output the JSON only. No preamble. No explanation. No markdown fence."""


def find_banned_phrases(text: str) -> list:
    text_lower = text.lower()
    return [p for p in BANNED_PHRASES if p in text_lower]


def parse_json_response(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw = "\n".join(lines).strip()
    return json.loads(raw)


def count_words(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def _require_api_key() -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key or api_key.endswith("...") or len(api_key) < 20:
        raise RuntimeError(
            "ANTHROPIC_API_KEY missing or placeholder. "
            f"Edit {REPO_ROOT / '.env.local'} and paste a real key (starts with sk-ant-)."
        )
    return api_key


def generate_script(
    mode: str,
    intent: str,
    first_action: str,
    hero: str,
    grounding_phrase: str,
    variant: str = "default",
    target_duration_seconds: int = 60,
) -> dict:
    if mode not in VALID_MODES:
        raise ValueError(f"mode must be one of {VALID_MODES}, got: {mode}")
    if variant not in VALID_VARIANTS:
        raise ValueError(f"variant must be one of {VALID_VARIANTS}, got: {variant}")

    api_key = _require_api_key()
    client = Anthropic(api_key=api_key)

    system_prompt = build_system_prompt(mode, variant)
    system_hash = hashlib.sha256(system_prompt.encode()).hexdigest()[:12]
    user_prompt = build_user_prompt(mode, variant, intent, first_action, hero, grounding_phrase, target_duration_seconds)

    attempts = []
    parsed: Optional[dict] = None
    script = ""
    word_count = 0
    violations: list = []

    for attempt_num in range(2):
        response = client.messages.create(
            model=MODEL_ID,
            max_tokens=MAX_TOKENS,
            temperature=TEMPERATURE,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw = response.content[0].text
        attempts.append({"attempt": attempt_num + 1, "raw_response": raw, "user_prompt_used": user_prompt})

        try:
            parsed = parse_json_response(raw)
            script = parsed.get("script", "").strip()
        except (json.JSONDecodeError, KeyError, AttributeError) as e:
            if attempt_num == 0:
                user_prompt = user_prompt + "\n\nPREVIOUS ATTEMPT FAILED: output was not valid JSON. OUTPUT VALID JSON ONLY. NO MARKDOWN FENCE. NO PREAMBLE."
                continue
            raise RuntimeError(f"failed to parse JSON after 2 attempts: {e}\nraw: {raw[:500]}")

        word_count = count_words(script)
        violations = find_banned_phrases(script)

        word_count_ok = 100 <= word_count <= 220
        no_violations = len(violations) == 0
        if word_count_ok and no_violations:
            break

        if attempt_num == 0:
            issues = []
            if not word_count_ok:
                target_words = int(target_duration_seconds * WORDS_PER_SECOND)
                issues.append(f"Word count was {word_count}, must be 100-220 (target ~{target_words}).")
            if violations:
                issues.append(f"Used banned phrases: {violations}. Remove all of these in the rewrite.")
            user_prompt = user_prompt + "\n\nPREVIOUS ATTEMPT FAILED: " + " ".join(issues) + " Try again. Same structure, same inputs, fix only the issues above."
            continue

    return {
        "script": script,
        "estimated_duration_seconds": int(round(word_count / WORDS_PER_SECOND)),
        "word_count": word_count,
        "mode": mode,
        "variant": variant,
        "model_used": MODEL_ID,
        "system_prompt_hash": system_hash,
        "violations": violations,
        "attempts": attempts,
        "inputs": {
            "intent": intent,
            "first_action": first_action,
            "hero": hero,
            "grounding_phrase": grounding_phrase,
            "target_duration_seconds": target_duration_seconds,
        },
    }


# --- experiment runner (15 scripts: 3 modes x 5 variants) ---

INTENT_TEMPLATE = {
    "hardest_work": {
        "intent": "ship the OATH v1 spec to github and send Oliver the link before noon",
        "first_action": "open the spec doc and write the wedge section",
        "hero": "Kobe Bryant",
        "grounding_phrase": "trust the work",
    },
    "gym_now": {
        "intent": "do the morning lift before opening any work doc",
        "first_action": "put shorts on and walk to the gym",
        "hero": "David Goggins",
        "grounding_phrase": "no one is coming, it's on you",
    },
    "grounding_phrases": {
        "intent": "finish the OATH spec without doomscrolling first",
        "first_action": "open the laptop and close every other tab",
        "hero": "Marcus Aurelius",
        "grounding_phrase": "the work is the way",
    },
}

VARIANTS_TO_RUN = ["default", "more_clipped", "more_narrative", "hero_anchor_heavy", "grounding_heavy"]


def run_experiment():
    output_dir = REPO_ROOT / "experiments" / "01-script-generation" / "outputs"
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")

    print(f"=== OATH script generation experiment ===")
    print(f"timestamp: {timestamp}")
    print(f"model:     {MODEL_ID}")
    print(f"runs:      {len(INTENT_TEMPLATE) * len(VARIANTS_TO_RUN)} (3 modes x 5 variants)")
    print()

    results_summary = []
    for mode, inputs in INTENT_TEMPLATE.items():
        for variant in VARIANTS_TO_RUN:
            label = f"{mode}__{variant}"
            print(f"--- {label} ---")
            try:
                result = generate_script(
                    mode=mode,
                    intent=inputs["intent"],
                    first_action=inputs["first_action"],
                    hero=inputs["hero"],
                    grounding_phrase=inputs["grounding_phrase"],
                    variant=variant,
                )
                json_path = output_dir / f"{label}__{timestamp}.json"
                txt_path = output_dir / f"{label}.txt"
                with open(json_path, "w") as f:
                    json.dump(result, f, indent=2)
                with open(txt_path, "w") as f:
                    f.write(result["script"])
                status = "OK" if not result["violations"] and 100 <= result["word_count"] <= 220 else "WARN"
                print(f"  [{status}] words={result['word_count']}, est={result['estimated_duration_seconds']}s, violations={result['violations']}")
                print(f"  wrote: {json_path.name}, {txt_path.name}")
                results_summary.append({
                    "mode": mode, "variant": variant, "status": status,
                    "word_count": result["word_count"],
                    "estimated_duration_seconds": result["estimated_duration_seconds"],
                    "violations": result["violations"],
                    "txt_path": str(txt_path.relative_to(REPO_ROOT)),
                })
            except Exception as e:
                print(f"  [FAIL] {e}")
                results_summary.append({"mode": mode, "variant": variant, "status": "FAIL", "error": str(e)})
            print()

    summary_path = output_dir / f"_summary__{timestamp}.json"
    with open(summary_path, "w") as f:
        json.dump({"timestamp": timestamp, "model": MODEL_ID, "results": results_summary}, f, indent=2)
    print(f"=== summary written: {summary_path.name} ===")
    return results_summary


if __name__ == "__main__":
    run_experiment()
