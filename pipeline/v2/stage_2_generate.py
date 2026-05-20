"""stage 2 — candidate script generation. produces N=3 candidates in parallel
using AsyncAnthropic. each candidate uses a different temperature
(0.6, 0.8, 1.0) to give a range from conservative to creative."""

import asyncio
import re
from anthropic import AsyncAnthropic

from _env import require_anthropic_key, parse_json_response
from prompts import build_base_system_prompt, BANNED_PHRASES
from few_shot_examples import render_for_prompt

MODEL_ID = "claude-sonnet-4-6"
MAX_TOKENS = 1000
TEMPERATURES = [0.6, 0.8, 1.0]
WORDS_PER_SECOND = 2.5


def count_words(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def find_banned(text: str) -> list:
    lower = text.lower()
    return [p for p in BANNED_PHRASES if p in lower]


def _build_user_prompt(inputs: dict, plan: dict) -> str:
    target_words = int(inputs["target_duration_seconds"] * WORDS_PER_SECOND)
    return f"""USER INPUTS:
mode: {inputs["mode"]}
variant: {inputs["variant"]}
user's intent (the hardest task they swore last night they'd tackle this morning): "{inputs["intent"]}"
user's first action (what they'll do in the first 5 minutes): "{inputs["first_action"]}"
user's hero (reference by concrete habit, never by invented quote): {inputs["hero"]}
user's grounding phrase (use verbatim, do not paraphrase): "{inputs["phrase"]}"

STRUCTURAL PLAN FROM PRE-ANALYSIS (follow this plan tightly):
- tone_notes: {plan["tone_notes"]}
- hero_anchor_strategy: {plan["hero_anchor_strategy"]}
- grounding_phrase_placement: {plan["grounding_phrase_placement"]}
- command_structure: {plan["command_structure"]}

TARGET: {inputs["target_duration_seconds"]} seconds (~{target_words} words at 150 wpm).

Output as JSON:
{{
  "script": "the spoken text, with line breaks for natural pauses",
  "estimated_duration_seconds": <integer>,
  "internal_self_check": <integer 1-10, your honest confidence that this script hits all 5 structural beats>
}}

Output the JSON only. No preamble. No explanation. No markdown fence."""


def _build_system_prompt(inputs: dict) -> str:
    base = build_base_system_prompt(inputs["mode"], inputs["variant"])
    few_shot = render_for_prompt(inputs["mode"])
    if few_shot:
        return base + "\n\n" + few_shot
    return base


async def _generate_one(client: AsyncAnthropic, system_prompt: str, user_prompt: str, temperature: float, candidate_id: int) -> dict:
    response = await client.messages.create(
        model=MODEL_ID,
        max_tokens=MAX_TOKENS,
        temperature=temperature,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = response.content[0].text
    parsed = parse_json_response(raw)
    script = (parsed.get("script") or "").strip()
    wc = count_words(script)
    return {
        "candidate_id": candidate_id,
        "script": script,
        "word_count": wc,
        "estimated_duration_seconds": int(round(wc / WORDS_PER_SECOND)),
        "internal_self_check": parsed.get("internal_self_check"),
        "temperature": temperature,
        "violations": find_banned(script),
        "raw_response": raw,
        "model_used": MODEL_ID,
    }


async def generate_candidates(inputs: dict, plan: dict, n: int = 3) -> list:
    """generate n candidate scripts in parallel using asyncio.gather()."""
    api_key = require_anthropic_key()
    client = AsyncAnthropic(api_key=api_key)
    system_prompt = _build_system_prompt(inputs)
    user_prompt = _build_user_prompt(inputs, plan)

    # n=3 default, temperatures cycle through TEMPERATURES list
    temps = (TEMPERATURES * ((n // len(TEMPERATURES)) + 1))[:n]

    tasks = [
        _generate_one(client, system_prompt, user_prompt, temps[i], candidate_id=i + 1)
        for i in range(n)
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    candidates = []
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            candidates.append({
                "candidate_id": i + 1,
                "script": "",
                "word_count": 0,
                "estimated_duration_seconds": 0,
                "internal_self_check": None,
                "temperature": temps[i],
                "violations": [],
                "error": str(r),
                "raw_response": "",
                "model_used": MODEL_ID,
            })
        else:
            candidates.append(r)
    return candidates
