"""stage 9 — music bed mixing.

v1.1 placeholder. returns the input audio unchanged. the function signature
exists so the orchestrator architecture supports the feature without faking it.

future work (v1.1, blocked on a $40-50/yr artlist or epidemic sound license):
- 10-20 pre-licensed instrumental beds in assets/beds/
- per-mode bed selection (intense for gym_now, calm for grounding_phrases, etc.)
- ffmpeg-based mix with ducking under the voice
- exposed as stage 9 output, downstream stages pass through unchanged
"""


def mix_music_bed(audio_path: str, mode: str) -> dict:
    # v1.1 stub — pass through. intentional. signals the architecture supports
    # this layer without faking the feature.
    return {
        "output_path": audio_path,
        "music_bed_used": None,
        "mix_applied": False,
        "stub_reason": (
            "music bed mixing deferred to v1.1 pending pre-licensed instrumental beds. "
            "see stage docstring for the v1.1 plan."
        ),
        "input_mode": mode,
    }
