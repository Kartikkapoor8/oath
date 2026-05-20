"""run_v2.py — CLI entrypoint for the v2 10-stage pipeline.

mirrors pipeline/run.py (the v1 CLI) but invokes the v2 orchestrator. supports
optional --save-stage-outputs to dump each stage's data as a separate json file,
which is what experiments/04-multi-pass-refinement uses.
"""

import sys
import argparse
import asyncio
from pathlib import Path

# ensure sibling modules are importable whether invoked as script or module
HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from pipeline import run_pipeline
from prompts import VALID_MODES, VALID_VARIANTS
from voice_settings import VOICE_PRESET_MAP

REPO_ROOT = HERE.parent.parent


def main():
    parser = argparse.ArgumentParser(
        prog="oath-v2",
        description=(
            "OATH v2 pipeline: 10 stages, ~8-9 claude calls (analyze, generate x3, critique x3, "
            "optional refine, judge), 1 elevenlabs synthesis. produces an mp3 in 20-30s."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "see docs/03-engine.md for the full architecture diagram.\n"
            "see experiments/04-multi-pass-refinement/ for a full stage-by-stage trace."
        ),
    )
    parser.add_argument("--mode", required=True, choices=VALID_MODES)
    parser.add_argument("--intent", required=True)
    parser.add_argument("--first-action", required=True, dest="first_action")
    parser.add_argument("--hero", required=True)
    parser.add_argument("--phrase", required=True)
    parser.add_argument("--variant", default="default", choices=VALID_VARIANTS)
    parser.add_argument("--voice", default="the_closer", choices=list(VOICE_PRESET_MAP.keys()))
    parser.add_argument("--output", default="./ritual_v2.mp3")
    parser.add_argument("--target-duration", type=int, default=60, dest="target_duration")
    parser.add_argument(
        "--save-stage-outputs",
        default=None,
        dest="save_stage_outputs",
        help="directory to write per-stage JSON files (e.g. experiments/04-multi-pass-refinement/stage_outputs)",
    )
    parser.add_argument(
        "--pipeline-run-path",
        default=None,
        dest="pipeline_run_path",
        help="path to write the consolidated pipeline_run.json (default: alongside --output)",
    )
    parser.add_argument(
        "--n-candidates",
        type=int,
        default=3,
        dest="n_candidates",
        help="number of candidate scripts to generate in parallel (default 3)",
    )
    parser.add_argument(
        "--quiet", action="store_true", help="suppress per-stage progress output"
    )
    args = parser.parse_args()

    inputs = {
        "mode": args.mode,
        "intent": args.intent,
        "first_action": args.first_action,
        "hero": args.hero,
        "phrase": args.phrase,
        "variant": args.variant,
        "voice": args.voice,
        "target_duration_seconds": args.target_duration,
    }

    pipeline_run_path = args.pipeline_run_path or str(Path(args.output).with_suffix(".pipeline_run.json"))

    print("=== OATH v2 pipeline ===")
    print(f"mode:         {args.mode}")
    print(f"intent:       {args.intent}")
    print(f"first action: {args.first_action}")
    print(f"hero:         {args.hero}")
    print(f"phrase:       {args.phrase}")
    print(f"variant:      {args.variant}")
    print(f"voice:        {args.voice}")
    print(f"output:       {args.output}")
    print(f"trace:        {pipeline_run_path}")
    if args.save_stage_outputs:
        print(f"stage outputs: {args.save_stage_outputs}")
    print()

    result = asyncio.run(
        run_pipeline(
            inputs=inputs,
            output_path=args.output,
            pipeline_run_path=pipeline_run_path,
            stage_outputs_dir=args.save_stage_outputs,
            verbose=not args.quiet,
            n_candidates=args.n_candidates,
        )
    )

    print("\n=== result ===")
    print(f"mp3:                   {result['final_mp3_path']}")
    print(f"trace json:            {result['pipeline_run_path']}")
    print(f"final score:           {result['final_score']}/10")
    print(f"get-out-of-bed:        {result['would_get_user_out_of_bed']}")
    print(f"refinement triggered:  {result['refinement_triggered']}")
    print(f"total elapsed:         {result['total_elapsed_seconds']}s")
    print(f"claude calls:          {result['total_claude_calls']}")
    print(f"elevenlabs calls:      {result['total_elevenlabs_calls']}")


if __name__ == "__main__":
    main()
