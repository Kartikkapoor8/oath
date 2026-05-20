"""stage 1 — pre-generation analysis. claude reads the inputs and produces
a structured plan that stage 2 will follow.

this is the chain-of-thought layer: 1 claude call to think about the script
before any script is written.
"""

from anthropic import Anthropic

from _env import require_anthropic_key, parse_json_response

MODEL_ID = "claude-sonnet-4-6"
MAX_TOKENS = 800
TEMPERATURE = 0.4

ANALYZE_SYSTEM_PROMPT = """You are the pre-generation analyzer for OATH, an alarm ritual app. Before a script is written, you analyze the user's inputs and produce a structural plan that the script generator will follow.

Your job is to:
1. Read the user's mode, intent, first action, hero, and grounding phrase
2. Decide the optimal tone for this specific combination (not the generic mode tone — the SPECIFIC tone given this user's specific inputs)
3. Identify the strongest hero anchor strategy (which specific habit, time, or moment of this hero applies most directly to this intent)
4. Recommend where the grounding phrase should land in the structural arc
5. Suggest the most effective command structure for the closing

You do NOT write the script. You write the plan.

Output JSON only:
{
  "tone_notes": "1-2 sentences on the precise tone — e.g., 'this user is committing to creative work, so the tone should be quiet intensity, not gym-bro hype'",
  "hero_anchor_strategy": "1-2 sentences on the specific hero moment to reference — e.g., 'reference Kobe's predawn shootarounds at the Lakers facility, no audience, before teammates arrived — this maps directly to the user shipping work before others start their day'",
  "grounding_phrase_placement": "where in the arc — e.g., 'right after the hero anchor, as the bridge between motivation and command'",
  "command_structure": "the form of the closing command — e.g., 'two-word imperative followed by physical action — open. write.'",
  "estimated_complexity": "low" | "medium" | "high"
}"""


def analyze_and_plan(inputs: dict) -> dict:
    api_key = require_anthropic_key()
    client = Anthropic(api_key=api_key)

    user_prompt = f"""User inputs:
- mode: {inputs["mode"]}
- intent: "{inputs["intent"]}"
- first_action: "{inputs["first_action"]}"
- hero: {inputs["hero"]}
- grounding_phrase: "{inputs["phrase"]}"
- variant: {inputs["variant"]}

Produce the structural plan as JSON only."""

    response = client.messages.create(
        model=MODEL_ID,
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
        system=ANALYZE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = response.content[0].text
    parsed = parse_json_response(raw)

    return {
        "tone_notes": parsed.get("tone_notes", ""),
        "hero_anchor_strategy": parsed.get("hero_anchor_strategy", ""),
        "grounding_phrase_placement": parsed.get("grounding_phrase_placement", ""),
        "command_structure": parsed.get("command_structure", ""),
        "estimated_complexity": parsed.get("estimated_complexity", "medium"),
        "raw_response": raw,
        "model_used": MODEL_ID,
    }
