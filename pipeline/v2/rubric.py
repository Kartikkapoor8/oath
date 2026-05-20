"""evaluation rubric for v2 stage 3 (critique).

6 axes, weighted. defines what 'good' means for an OATH ritual script in measurable terms.
"""

RUBRIC_AXES = {
    "specificity": {
        "weight": 2.0,  # most important: must reference user's exact intent
        "description": "does the script reference the user's specific intent verbatim or near-verbatim?",
        "anchors": {
            10: "Quotes the user's intent in the first 15 seconds, references the first_action by the closing",
            7: "References the intent paraphrased or partially",
            4: "Mentions the general task but doesn't quote the user's specific words",
            1: "Generic motivation, could be the same script for any user",
        },
    },
    "command_density": {
        "weight": 1.5,
        "description": "how many imperative verbs vs descriptive sentences?",
        "anchors": {
            10: "5+ imperative verbs, each on its own line, no rhetorical questions",
            7: "3-4 imperatives, mix of commands and statements",
            4: "1-2 imperatives, mostly descriptive",
            1: "No commands, all rhetorical or descriptive",
        },
    },
    "structural_arc_completeness": {
        "weight": 1.5,
        "description": "does the script hit all 5 beats (groggy reality, quoted intent, concrete hero, grounding phrase, command)?",
        "anchors": {
            10: "All 5 beats present, in order, distinct",
            7: "4 of 5 beats present",
            4: "3 of 5 beats present or out of order",
            1: "Missing 3+ beats or structure entirely",
        },
    },
    "cliche_freedom": {
        "weight": 1.0,
        "description": "absence of subtle motivational clichés (beyond the banned list)",
        "anchors": {
            10: "Zero clichés, every line earns its place",
            7: "1-2 mild clichés that still feel earned",
            4: "Multiple subtle clichés, generic in places",
            1: "Motivational poster, full of clichés",
        },
    },
    "hero_anchor_concreteness": {
        "weight": 1.5,
        "description": "is the hero referenced with specific habit/time/place, or vague platitude?",
        "anchors": {
            10: "Specific time + place + habit (e.g., '4am at the Lakers facility, before anyone else')",
            7: "Specific habit, vague on time or place",
            4: "Generic habit ('worked hard')",
            1: "No hero reference or invented quote",
        },
    },
    "voice_directness": {
        "weight": 1.0,
        "description": "statements and commands vs questions and hedges",
        "anchors": {
            10: "All declaratives and imperatives, zero question marks, zero 'you should' or 'try to'",
            7: "Mostly declarative, occasional hedge",
            4: "Multiple hedges or questions",
            1: "Tentative, full of qualifications",
        },
    },
}

THRESHOLDS = {
    "minimum_overall_score": 7.0,   # below: refinement is triggered
    "minimum_axis_score": 5.0,      # any axis below: refinement is triggered
}


def axis_names() -> list:
    return list(RUBRIC_AXES.keys())


def total_weight() -> float:
    return sum(axis["weight"] for axis in RUBRIC_AXES.values())


def compute_overall_score(scores: dict) -> float:
    """weighted average of the 6 raw axis scores."""
    tw = total_weight()
    if tw <= 0:
        return 0.0
    weighted_sum = sum(scores.get(name, 0) * RUBRIC_AXES[name]["weight"] for name in RUBRIC_AXES)
    return round(weighted_sum / tw, 2)


def passes_threshold(scores: dict, overall: float) -> bool:
    """true if overall meets minimum AND no individual axis is below minimum_axis_score."""
    if overall < THRESHOLDS["minimum_overall_score"]:
        return False
    for name in RUBRIC_AXES:
        if scores.get(name, 0) < THRESHOLDS["minimum_axis_score"]:
            return False
    return True


def find_weakest_axis(scores: dict) -> str:
    """return the axis name with the lowest score."""
    if not scores:
        return ""
    return min(scores, key=lambda k: scores[k])


def rubric_as_prompt_text() -> str:
    """render the rubric definitions for inclusion in the critique system prompt."""
    lines = []
    for name, axis in RUBRIC_AXES.items():
        lines.append(f"- {name} (weight {axis['weight']}): {axis['description']}")
        for score, anchor in sorted(axis["anchors"].items(), reverse=True):
            lines.append(f"    {score}/10: {anchor}")
    return "\n".join(lines)
