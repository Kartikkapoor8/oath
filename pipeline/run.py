"""run.py — OATH end-to-end orchestrator.

cli tool that takes user inputs (mode, intent, hero, phrase, etc) and produces an
mp3 ritual end-to-end in one command. for full context see README.md and
experiments/01-script-generation/prompts.md for how the prompts compose.
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_script import generate_script, VALID_MODES, VALID_VARIANTS
from synthesize_audio import synthesize_audio, VOICE_PRESET_MAP

REPO_ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(
        prog="oath",
        description=(
            "OATH end-to-end orchestrator: takes the user's night-before commitment "
            "and produces a 45-90 second mp3 ritual. uses claude sonnet 4.6 for "
            "the script and elevenlabs flash v2.5 for the voice."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "see README.md for context on the wedge and architecture.\n"
            "see experiments/01-script-generation/prompts.md for how the 3-layer\n"
            "system prompt composes (identity + mode + variant overlay)."
        ),
    )
    parser.add_argument("--mode", required=True, choices=VALID_MODES,
                        help="which ritual mode to generate")
    parser.add_argument("--intent", required=True,
                        help="the hardest task the user swore last night they'd tackle this morning, in their own words")
    parser.add_argument("--first-action", required=True, dest="first_action",
                        help="the concrete first action the user will take in the first 5 minutes")
    parser.add_argument("--hero", required=True,
                        help="one hero name to reference by concrete habit (e.g., 'Kobe Bryant')")
    parser.add_argument("--phrase", required=True,
                        help="user's grounding phrase, used verbatim in the script")
    parser.add_argument("--variant", default="default", choices=VALID_VARIANTS,
                        help="prompt variant overlay (default: default)")
    parser.add_argument("--voice", default="the_closer", choices=list(VOICE_PRESET_MAP.keys()),
                        help="voice preset archetype (default: the_closer)")
    parser.add_argument("--output", default="./ritual.mp3",
                        help="output mp3 path (default: ./ritual.mp3)")
    parser.add_argument("--target-duration", type=int, default=60, dest="target_duration",
                        help="target read duration in seconds (default: 60)")
    args = parser.parse_args()

    print("=== OATH end-to-end run ===")
    print(f"mode:         {args.mode}")
    print(f"intent:       {args.intent}")
    print(f"first action: {args.first_action}")
    print(f"hero:         {args.hero}")
    print(f"phrase:       {args.phrase}")
    print(f"variant:      {args.variant}")
    print(f"voice:        {args.voice}")
    print(f"output:       {args.output}")
    print()

    print("=== generating script ===")
    script_result = generate_script(
        mode=args.mode,
        intent=args.intent,
        first_action=args.first_action,
        hero=args.hero,
        grounding_phrase=args.phrase,
        variant=args.variant,
        target_duration_seconds=args.target_duration,
    )
    print(script_result["script"])
    print()
    print(f"word count: {script_result['word_count']}, estimated duration: {script_result['estimated_duration_seconds']}s")
    if script_result["violations"]:
        print(f"WARN: banned phrase violations: {script_result['violations']}")
    print()

    print("=== synthesizing audio ===")
    audio_result = synthesize_audio(
        script=script_result["script"],
        output_path=args.output,
        voice_preset=args.voice,
    )
    print(f"saved:  {audio_result['output_path']}")
    print(f"size:   {audio_result['audio_bytes']} bytes (~{audio_result['estimated_duration_seconds']}s)")
    print(f"voice:  {audio_result['voice_preset']} ({audio_result['voice_label']})")
    print()

    timestamp = datetime.now().strftime("%Y%m%dT%H%M%S")
    run_log_dir = REPO_ROOT / "experiments" / "03-end-to-end-runs"
    run_log_dir.mkdir(parents=True, exist_ok=True)
    run_log = run_log_dir / f"{timestamp}.json"
    with open(run_log, "w") as f:
        json.dump({
            "timestamp": timestamp,
            "inputs": vars(args),
            "script_result": {k: v for k, v in script_result.items() if k != "attempts"},
            "audio_result": audio_result,
        }, f, indent=2)
    print(f"run logged: {run_log.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
