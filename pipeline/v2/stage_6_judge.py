"""stage 6 — llm-as-judge final scoring.

a different prompt than the critique — this is a holistic judge, not a rubric.
asks claude to imagine itself as the user and give a single 1-10 score plus
a binary get-out-of-bed verdict.
"""

from anthropic import AsyncAnthropic

from _env import require_anthropic_key, parse_json_response

MODEL_ID = "claude-sonnet-4-6"
MAX_TOKENS = 500
TEMPERATURE = 0.3


JUDGE_SYSTEM_PROMPT = """You are the final judge for OATH alarm ritual scripts. Your job is to give a single 1-10 quality score and a binary judgment on whether this script would actually get a real groggy person out of bed and into their committed task.

Imagine yourself as the user: tired, in bed, you just dismissed an alarm, and you just heard this script. Would it work on you?

Score 1-10 holistically. Give a binary yes/no on the get-out-of-bed question. Add 1-2 sentences on why.

Be honest. A 6 means "okay but not memorable." A 9 means "this would actually move me." A 4 means "this is generic motivation and I'd open TikTok." Save 10 for scripts that feel inevitable.

Output JSON only:
{
  "final_quality_score": <float 1-10>,
  "would_get_user_out_of_bed": <true | false>,
  "judge_notes": "1-2 sentences on why"
}"""


async def judge_final_script(script: str, inputs: dict) -> dict:
    api_key = require_anthropic_key()
    client = AsyncAnthropic(api_key=api_key)

    user_prompt = f"""USER INPUTS (so you know who the script is for):
mode: {inputs["mode"]}
intent: "{inputs["intent"]}"
first_action: "{inputs["first_action"]}"
hero: {inputs["hero"]}
grounding_phrase: "{inputs["phrase"]}"

THE SCRIPT TO JUDGE:
---
{script}
---

Give the final 1-10 score and the binary get-out-of-bed verdict. JSON only."""

    response = await client.messages.create(
        model=MODEL_ID,
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
        system=JUDGE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = response.content[0].text
    parsed = parse_json_response(raw)

    try:
        score = float(parsed.get("final_quality_score", 0))
    except (TypeError, ValueError):
        score = 0.0
    score = max(1.0, min(10.0, score))

    return {
        "final_quality_score": round(score, 1),
        "would_get_user_out_of_bed": bool(parsed.get("would_get_user_out_of_bed", False)),
        "judge_notes": parsed.get("judge_notes", ""),
        "raw_response": raw,
        "model_used": MODEL_ID,
    }
