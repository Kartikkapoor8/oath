"""stage 3 — critique each candidate against the 6-axis rubric.

3 parallel claude calls (one per candidate). each returns a structured
score per axis plus a critique paragraph identifying the weakest axis.
"""

import asyncio
from anthropic import AsyncAnthropic

from _env import require_anthropic_key, parse_json_response
from rubric import (
    RUBRIC_AXES,
    axis_names,
    compute_overall_score,
    find_weakest_axis,
    rubric_as_prompt_text,
)

MODEL_ID = "claude-sonnet-4-6"
MAX_TOKENS = 800
TEMPERATURE = 0.2  # low — we want consistent judgments


CRITIQUE_SYSTEM_PROMPT = f"""You are the critique layer for OATH's alarm ritual generation pipeline. Your job is to evaluate a generated script against a 6-axis rubric and identify the weakest axis for refinement.

You will receive:
1. The user's inputs (mode, intent, first action, hero, phrase)
2. A candidate script
3. The rubric below

Score each axis 1-10. Provide the overall weighted score. Identify the weakest axis. Write 2-3 sentences of critique notes that explain WHY the weakest axis scored low and what specifically needs to change.

Be honest. If the script is mediocre, score it accurately. Inflated scores produce inflated retries.

THE RUBRIC:
{rubric_as_prompt_text()}

Output JSON only:
{{
  "scores": {{
    "specificity": <1-10>,
    "command_density": <1-10>,
    "structural_arc_completeness": <1-10>,
    "cliche_freedom": <1-10>,
    "hero_anchor_concreteness": <1-10>,
    "voice_directness": <1-10>
  }},
  "weakest_axis": "<axis name>",
  "critique_notes": "2-3 sentences explaining why the weakest axis scored low and what to fix"
}}"""


def _build_user_prompt(candidate: dict, inputs: dict) -> str:
    return f"""USER INPUTS:
mode: {inputs["mode"]}
intent: "{inputs["intent"]}"
first_action: "{inputs["first_action"]}"
hero: {inputs["hero"]}
grounding_phrase: "{inputs["phrase"]}"

CANDIDATE SCRIPT (candidate_id {candidate["candidate_id"]}, temperature {candidate.get("temperature")}):
---
{candidate["script"]}
---

Score each rubric axis and identify the weakest. Output JSON only."""


async def _critique_one(client: AsyncAnthropic, candidate: dict, inputs: dict) -> dict:
    if not candidate.get("script") or "error" in candidate:
        # candidate had a generation error; produce a zero critique so selection can skip it
        return {
            "candidate_id": candidate["candidate_id"],
            "scores": {name: 0 for name in axis_names()},
            "overall_score": 0.0,
            "weakest_axis": axis_names()[0],
            "critique_notes": "candidate failed generation",
            "raw_response": "",
            "model_used": MODEL_ID,
        }

    user_prompt = _build_user_prompt(candidate, inputs)
    response = await client.messages.create(
        model=MODEL_ID,
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
        system=CRITIQUE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = response.content[0].text
    parsed = parse_json_response(raw)
    raw_scores = parsed.get("scores", {}) or {}

    # ensure all axes present, clamp to [1, 10]
    scores = {}
    for name in axis_names():
        v = raw_scores.get(name, 5)
        try:
            v = int(v)
        except (TypeError, ValueError):
            v = 5
        scores[name] = max(1, min(10, v))

    overall = compute_overall_score(scores)
    weakest = parsed.get("weakest_axis") or find_weakest_axis(scores)
    if weakest not in RUBRIC_AXES:
        weakest = find_weakest_axis(scores)

    return {
        "candidate_id": candidate["candidate_id"],
        "scores": scores,
        "overall_score": overall,
        "weakest_axis": weakest,
        "critique_notes": parsed.get("critique_notes", ""),
        "raw_response": raw,
        "model_used": MODEL_ID,
    }


async def critique_candidates(candidates: list, inputs: dict) -> list:
    api_key = require_anthropic_key()
    client = AsyncAnthropic(api_key=api_key)
    tasks = [_critique_one(client, c, inputs) for c in candidates]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    critiques = []
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            critiques.append({
                "candidate_id": candidates[i]["candidate_id"],
                "scores": {name: 0 for name in axis_names()},
                "overall_score": 0.0,
                "weakest_axis": axis_names()[0],
                "critique_notes": f"critique failed: {r}",
                "raw_response": "",
                "model_used": MODEL_ID,
            })
        else:
            critiques.append(r)
    return critiques
