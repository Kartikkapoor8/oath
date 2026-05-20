"""stage 10 — output assembly and full pipeline logging.

bundles the final mp3 path with a complete pipeline_run.json containing every
stage's input and output. optionally writes each stage's data to its own json
file in a stage_outputs/ directory for inspection.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


def _utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def assemble_output(
    stage_outputs: dict,
    final_audio_path: str,
    inputs: dict,
    total_elapsed_seconds: float,
    pipeline_run_path: str,
    total_claude_calls: int,
    total_elevenlabs_calls: int,
    stage_outputs_dir: Optional[Path] = None,
) -> dict:
    """assemble the final run trace and write it to disk.

    if stage_outputs_dir is provided, also write each stage's data to its own
    json file for separate inspection (used by experiments/04).
    """
    consolidated = {
        "timestamp": _utc_iso(),
        "inputs": inputs,
        "total_elapsed_seconds": round(total_elapsed_seconds, 2),
        "total_claude_calls": total_claude_calls,
        "total_elevenlabs_calls": total_elevenlabs_calls,
        "final_mp3_path": final_audio_path,
        **stage_outputs,
    }

    pipeline_run_p = Path(pipeline_run_path)
    pipeline_run_p.parent.mkdir(parents=True, exist_ok=True)
    with open(pipeline_run_p, "w") as f:
        json.dump(consolidated, f, indent=2)

    written_stage_files: list = []
    if stage_outputs_dir is not None:
        sod = Path(stage_outputs_dir)
        sod.mkdir(parents=True, exist_ok=True)

        # map keys to filenames
        stage_filenames = {
            "stage_0_validation": "stage_0_validation.json",
            "stage_1_analysis": "stage_1_analysis.json",
            "stage_2_candidates": "stage_2_candidates.json",
            "stage_3_critiques": "stage_3_critiques.json",
            "stage_4_selection": "stage_4_selection.json",
            "stage_5_refinement": "stage_5_refinement.json",
            "stage_6_judge": "stage_6_judge.json",
            "stage_7_prosody": "stage_7_prosody.json",
            "stage_8_synthesis": "stage_8_synthesis.json",
            "stage_9_music_bed": "stage_9_music_bed.json",
        }
        for key, filename in stage_filenames.items():
            if key in stage_outputs:
                p = sod / filename
                with open(p, "w") as f:
                    json.dump(stage_outputs[key], f, indent=2)
                written_stage_files.append(str(p))

    return {
        "final_mp3_path": final_audio_path,
        "pipeline_run_path": str(pipeline_run_p),
        "stage_files_written": written_stage_files,
    }
