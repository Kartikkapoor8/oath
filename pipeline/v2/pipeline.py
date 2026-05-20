"""orchestrator for the v2 10-stage pipeline.

run_pipeline() coordinates stages 0-10 with the right sync/async semantics:
- stages 0, 4, 7, 9, 10 are pure sync logic
- stages 1, 2, 3, 5, 6 are async claude calls (2, 3 are parallel)
- stage 8 is sync (single elevenlabs call)

returns the final mp3 path + the pipeline_run.json path + summary fields.
"""

import sys
import time
import asyncio
from pathlib import Path
from typing import Optional

# ensure sibling stage modules are importable whether run as script or module
HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from stage_0_validate import validate_and_normalize
from stage_1_analyze import analyze_and_plan
from stage_2_generate import generate_candidates
from stage_3_critique import critique_candidates
from stage_4_select import select_winner
from stage_5_refine import refine_script
from stage_6_judge import judge_final_script
from stage_7_prosody import add_prosody_markup, count_break_tags
from stage_8_synthesize import synthesize
from stage_9_music_bed import mix_music_bed
from stage_10_assemble import assemble_output


def _now() -> float:
    return time.perf_counter()


async def run_pipeline(
    inputs: dict,
    output_path: str,
    pipeline_run_path: str,
    stage_outputs_dir: Optional[str] = None,
    verbose: bool = True,
    n_candidates: int = 3,
) -> dict:
    """run all 10 stages end-to-end."""
    start = _now()
    timings: dict = {}
    claude_calls = 0
    elevenlabs_calls = 0

    def log(msg: str):
        if verbose:
            print(msg, flush=True)

    stage_outputs: dict = {}

    # ---- Stage 0: validate ----
    t = _now()
    log("\n=== stage 0: validate ===")
    validated = validate_and_normalize(inputs)
    timings["stage_0"] = _now() - t
    stage_outputs["stage_0_validation"] = {
        "input": inputs,
        "normalized": validated,
        "elapsed_seconds": round(timings["stage_0"], 3),
    }
    log(f"  normalized: mode={validated['mode']} variant={validated['variant']} voice={validated['voice']}")

    # ---- Stage 1: analyze & plan ----
    t = _now()
    log("\n=== stage 1: analyze & plan (1 claude call) ===")
    plan = analyze_and_plan(validated)
    claude_calls += 1
    timings["stage_1"] = _now() - t
    stage_outputs["stage_1_analysis"] = {
        "plan": plan,
        "elapsed_seconds": round(timings["stage_1"], 3),
    }
    log(f"  tone_notes: {plan['tone_notes'][:100]}...")
    log(f"  hero_anchor_strategy: {plan['hero_anchor_strategy'][:100]}...")
    log(f"  estimated_complexity: {plan['estimated_complexity']}")

    # ---- Stage 2: generate N candidates in parallel ----
    t = _now()
    log(f"\n=== stage 2: generate {n_candidates} candidates in parallel ({n_candidates} claude calls) ===")
    candidates = await generate_candidates(validated, plan, n=n_candidates)
    claude_calls += n_candidates
    timings["stage_2"] = _now() - t
    stage_outputs["stage_2_candidates"] = {
        "candidates": candidates,
        "elapsed_seconds": round(timings["stage_2"], 3),
        "n": n_candidates,
        "temperatures": [c.get("temperature") for c in candidates],
    }
    for c in candidates:
        if c.get("error"):
            log(f"  candidate {c['candidate_id']}: ERROR — {c['error']}")
        else:
            log(f"  candidate {c['candidate_id']} (temp {c['temperature']}): {c['word_count']} words, self-check {c.get('internal_self_check')}")

    # ---- Stage 3: critique each candidate in parallel ----
    t = _now()
    log(f"\n=== stage 3: critique each candidate against 6-axis rubric ({n_candidates} claude calls) ===")
    critiques = await critique_candidates(candidates, validated)
    claude_calls += n_candidates
    timings["stage_3"] = _now() - t
    stage_outputs["stage_3_critiques"] = {
        "critiques": critiques,
        "elapsed_seconds": round(timings["stage_3"], 3),
    }
    for cr in critiques:
        log(f"  candidate {cr['candidate_id']}: overall {cr['overall_score']}/10 (weakest: {cr['weakest_axis']})")

    # ---- Stage 4: select winner ----
    t = _now()
    log("\n=== stage 4: select winner (pure logic) ===")
    selection = select_winner(candidates, critiques)
    timings["stage_4"] = _now() - t
    stage_outputs["stage_4_selection"] = {
        "winner_candidate_id": selection["winner"]["candidate_id"],
        "winner_critique": selection["winner_critique"],
        "passes_threshold": selection["passes_threshold"],
        "refinement_needed": selection["refinement_needed"],
        "selection_reason": selection["selection_reason"],
        "elapsed_seconds": round(timings["stage_4"], 3),
    }
    log(f"  {selection['selection_reason']}")

    # ---- Stage 5: refine if needed ----
    final_script_text = selection["winner"]["script"]
    if selection["refinement_needed"]:
        t = _now()
        log("\n=== stage 5: refine (1 claude call) ===")
        refinement = await refine_script(
            selection["winner"], selection["winner_critique"], validated, plan
        )
        claude_calls += 1
        timings["stage_5"] = _now() - t
        final_script_text = refinement["refined_script"]
        stage_outputs["stage_5_refinement"] = {
            "refined_script": refinement["refined_script"],
            "word_count": refinement["word_count"],
            "estimated_duration_seconds": refinement["estimated_duration_seconds"],
            "what_was_fixed": refinement["what_was_fixed"],
            "previous_winner_critique": refinement["previous_winner_critique"],
            "violations": refinement["violations"],
            "elapsed_seconds": round(timings["stage_5"], 3),
        }
        log(f"  refined: {refinement['word_count']} words")
        log(f"  what_was_fixed: {refinement['what_was_fixed']}")
    else:
        log("\n=== stage 5: refine — SKIPPED (winner passed threshold) ===")
        stage_outputs["stage_5_refinement"] = None
        timings["stage_5"] = 0.0

    # ---- Stage 6: judge ----
    t = _now()
    log("\n=== stage 6: judge final script (1 claude call) ===")
    judgment = await judge_final_script(final_script_text, validated)
    claude_calls += 1
    timings["stage_6"] = _now() - t
    stage_outputs["stage_6_judge"] = {
        **judgment,
        "elapsed_seconds": round(timings["stage_6"], 3),
    }
    log(f"  final_quality_score: {judgment['final_quality_score']}/10")
    log(f"  would_get_user_out_of_bed: {judgment['would_get_user_out_of_bed']}")
    log(f"  judge_notes: {judgment['judge_notes']}")

    # ---- Stage 7: prosody markup ----
    t = _now()
    log("\n=== stage 7: prosody markup (pure logic) ===")
    marked_up = add_prosody_markup(final_script_text, validated["mode"], validated["phrase"])
    timings["stage_7"] = _now() - t
    breaks = count_break_tags(marked_up)
    stage_outputs["stage_7_prosody"] = {
        "input_script": final_script_text,
        "marked_up_script": marked_up,
        "break_tag_count": breaks,
        "mode_tuning_applied": validated["mode"],
        "elapsed_seconds": round(timings["stage_7"], 3),
    }
    log(f"  inserted {breaks} <break /> tags (mode-tuned for {validated['mode']})")

    # ---- Stage 8: synthesize ----
    t = _now()
    log("\n=== stage 8: synthesize audio (1 elevenlabs call, mode-tuned voice settings) ===")
    synth = synthesize(
        script=marked_up,
        voice_preset=validated["voice"],
        mode=validated["mode"],
        output_path=output_path,
    )
    elevenlabs_calls += 1
    timings["stage_8"] = _now() - t
    stage_outputs["stage_8_synthesis"] = {
        **synth,
        "elapsed_seconds": round(timings["stage_8"], 3),
    }
    log(f"  saved: {synth['output_path']} ({synth['audio_bytes']} bytes, ~{synth['estimated_duration_seconds']}s)")
    log(f"  voice: {synth['voice_preset']} ({synth['voice_label']}) — settings: {synth['voice_settings_used']}")

    # ---- Stage 9: music bed (v1.1 stub) ----
    t = _now()
    log("\n=== stage 9: music bed (v1.1 stub — pass through) ===")
    music = mix_music_bed(synth["output_path"], validated["mode"])
    timings["stage_9"] = _now() - t
    stage_outputs["stage_9_music_bed"] = {
        **music,
        "elapsed_seconds": round(timings["stage_9"], 3),
    }
    log(f"  {music['stub_reason']}")

    # ---- Stage 10: assemble + write trace ----
    t = _now()
    log("\n=== stage 10: assemble & log ===")
    total_elapsed = _now() - start
    assembly = assemble_output(
        stage_outputs=stage_outputs,
        final_audio_path=music["output_path"],
        inputs=validated,
        total_elapsed_seconds=total_elapsed,
        pipeline_run_path=pipeline_run_path,
        total_claude_calls=claude_calls,
        total_elevenlabs_calls=elevenlabs_calls,
        stage_outputs_dir=Path(stage_outputs_dir) if stage_outputs_dir else None,
    )
    timings["stage_10"] = _now() - t
    log(f"  pipeline_run.json: {assembly['pipeline_run_path']}")
    if assembly["stage_files_written"]:
        log(f"  per-stage files: {len(assembly['stage_files_written'])} files in stage_outputs_dir")

    # final summary
    log("\n=== summary ===")
    log(f"  total elapsed:          {total_elapsed:.2f}s")
    log(f"  claude calls:           {claude_calls}")
    log(f"  elevenlabs calls:       {elevenlabs_calls}")
    log(f"  final quality score:    {judgment['final_quality_score']}/10")
    log(f"  would get out of bed:   {judgment['would_get_user_out_of_bed']}")
    log(f"  refinement triggered:   {selection['refinement_needed']}")

    return {
        "final_mp3_path": music["output_path"],
        "pipeline_run_path": assembly["pipeline_run_path"],
        "final_score": judgment["final_quality_score"],
        "would_get_user_out_of_bed": judgment["would_get_user_out_of_bed"],
        "total_elapsed_seconds": round(total_elapsed, 2),
        "total_claude_calls": claude_calls,
        "total_elevenlabs_calls": elevenlabs_calls,
        "refinement_triggered": selection["refinement_needed"],
    }
