"""prompt constants for v2 — duplicated from v1 generate_script.py to keep v1 untouched.

if these strings drift between v1 and v2 over time, that's intentional: v2 owns its own
prompt copy so future iterations don't require touching the v1 module (which is frozen
for backward compatibility and morning-test reproducibility).
"""

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


def build_base_system_prompt(mode: str, variant: str) -> str:
    """compose layer 1 + layer 2 (mode) + layer 3 (variant overlay)."""
    parts = [LAYER_1, MODE_PROMPTS[mode]]
    overlay = VARIANT_OVERLAYS.get(variant, "")
    if overlay.strip():
        parts.append(overlay)
    return "\n\n".join(parts)
