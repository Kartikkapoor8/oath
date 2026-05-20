"""stage 4 — candidate selection. pure logic, no claude call.

1. filter candidates that pass minimum thresholds
2. if any pass: pick highest overall_score
3. if none pass: pick closest-to-passing (highest overall), flag refinement_needed
"""

from rubric import passes_threshold


def select_winner(candidates: list, critiques: list) -> dict:
    if not candidates or not critiques or len(candidates) != len(critiques):
        raise ValueError("candidates and critiques must be non-empty and same length")

    # zip into (candidate, critique) tuples
    pairs = list(zip(candidates, critiques))

    # try threshold-passing candidates first
    passing = [
        (c, cr) for c, cr in pairs
        if passes_threshold(cr["scores"], cr["overall_score"])
    ]

    if passing:
        winner, winner_critique = max(passing, key=lambda p: p[1]["overall_score"])
        return {
            "winner": winner,
            "winner_critique": winner_critique,
            "passes_threshold": True,
            "refinement_needed": False,
            "selection_reason": (
                f"candidate {winner['candidate_id']} passed thresholds with overall "
                f"{winner_critique['overall_score']}/10 (best of {len(passing)} passing)"
            ),
        }

    # nothing passed — pick highest overall, flag refinement needed
    winner, winner_critique = max(pairs, key=lambda p: p[1]["overall_score"])
    return {
        "winner": winner,
        "winner_critique": winner_critique,
        "passes_threshold": False,
        "refinement_needed": True,
        "selection_reason": (
            f"no candidate passed thresholds. picked candidate {winner['candidate_id']} "
            f"as closest-to-passing (overall {winner_critique['overall_score']}/10, "
            f"weakest axis: {winner_critique['weakest_axis']})"
        ),
    }
