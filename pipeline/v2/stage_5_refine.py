"""stage 5 — refinement pass.

if no candidate passed the rubric thresholds in stage 4, this stage regenerates
the script with the critique injected as targeted feedback. uses the same
system prompt as stage 2 plus a focused instruction about the weakest axis.
"""

import re
import asyncio
from anthropic import AsyncAnthropic

from _env import require_anthropic_key, parse_json_response
from prompts import build_base_system_prompt, BANNED_PHRASES
from few_shot_examples import render_for_prompt

MODEL_ID = "claude-sonnet-4-6"
MAX_TOKENS = 1000
TEMPERATURE = 0.5  # slightly cooler than candidates — we want a controlled fix
WORDS_PER_SECOND = 2.5


def _count_words(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def _find_banned(text: str) -> list:
    lower = text.lower()
    return [p for p in BANNED_PHRASES if p in lower]


def _build_system_prompt(inputs: dict) -> str:
    base = build_base_system_prompt(inputs["mode"], inputs["variant"])
    few_shot = render_for_prompt(inputs["mode"])
    if few_shot:
        return base + "\n\n" + few_shot
    return base


def _build_refine_user_prompt(winner: dict, critique: dict, inputs: dict, plan: dict) -> str:
    target_words = int(inputs["target_duration_seconds"] * WORDS_PER_SECOND)
    weakest = critique["weakest_axis"]
    weakest_score = critique["scores"].get(weakest, 0)
    overall = critique["overall_score"]

    return f"""USER INPUTS:
mode: {inputs["mode"]}
intent: "{inputs["intent"]}"
first_action: "{inputs["first_action"]}"
hero: {inputs["hero"]}
grounding_phrase: "{inputs["phrase"]}"

STRUCTURAL PLAN:
- tone_notes: {plan["tone_notes"]}
- hero_anchor_strategy: {plan["hero_anchor_strategy"]}
- grounding_phrase_placement: {plan["grounding_phrase_placement"]}
- command_structure: {plan["command_structure"]}

PREVIOUS ATTEMPT (this is the previous best candidate, but it scored below threshold):
---
{winner["script"]}
---

The previous attempt scored {overall}/10 overall.
Weakest axis: {weakest} ({weakest_score}/10).
Critique notes: {critique["critique_notes"]}

REGENERATE the script with specific attention to fixing the weakest axis while preserving the other strengths. Keep what worked about the structural arc; fix what was specifically flagged.

TARGET: {inputs["target_duration_seconds"]} seconds (~{target_words} words at 150 wpm).

Output as JSON:
{{
  "script": "the refined spoken text",
  "estimated_duration_seconds": <integer>,
  "what_was_fixed": "1 sentence on what specifically changed vs the previous attempt"
}}

Output the JSON only. No preamble. No explanation. No markdown fence."""


async def refine_script(winner: dict, critique: dict, inputs: dict, plan: dict) -> dict:
    api_key = require_anthropic_key()
    client = AsyncAnthropic(api_key=api_key)

    system_prompt = _build_system_prompt(inputs)
    user_prompt = _build_refine_user_prompt(winner, critique, inputs, plan)

    response = await client.messages.create(
        model=MODEL_ID,
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = response.content[0].text
    parsed = parse_json_response(raw)
    refined_script = (parsed.get("script") or "").strip()
    wc = _count_words(refined_script)

    return {
        "refined_script": refined_script,
        "word_count": wc,
        "estimated_duration_seconds": int(round(wc / WORDS_PER_SECOND)),
        "what_was_fixed": parsed.get("what_was_fixed", ""),
        "previous_winner_critique": critique,
        "violations": _find_banned(refined_script),
        "raw_response": raw,
        "model_used": MODEL_ID,
    }
