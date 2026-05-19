"""generate_voice_samples.py — pre-generate 5 short audio samples, one per voice preset.

each sample uses the same hardest_work-style 30-40 word script so visitors to the
web demo can hear all 5 archetypes against an identical baseline. saves mp3s to
web/public/voice-preset-{name}.mp3.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from synthesize_audio import synthesize_audio, VOICE_PRESET_MAP

REPO_ROOT = Path(__file__).resolve().parent.parent
WEB_PUBLIC = REPO_ROOT / "web" / "public"
WEB_PUBLIC.mkdir(parents=True, exist_ok=True)

# Same short script played across all 5 voices so the listener can A/B the archetype, not the content.
SAMPLE_SCRIPT = (
    "It is early. The room is dark. You said you'd start with the hardest thing. "
    "Trust the work. Forty-five minutes. Phone face down. Write."
)


def main():
    print(f"=== generating 5 voice preset samples ===")
    print(f"script: {SAMPLE_SCRIPT[:80]}...")
    print()
    for preset_name in VOICE_PRESET_MAP.keys():
        out_path = WEB_PUBLIC / f"voice-preset-{preset_name.replace('the_', '')}.mp3"
        print(f"--- {preset_name} ---")
        try:
            result = synthesize_audio(
                script=SAMPLE_SCRIPT,
                output_path=str(out_path),
                voice_preset=preset_name,
            )
            print(f"  saved: {out_path.name}")
            print(f"  size:  {result['audio_bytes']} bytes (~{result['estimated_duration_seconds']}s)")
            print(f"  voice: {result['voice_preset']} ({result['voice_label']})")
        except Exception as e:
            print(f"  [FAIL] {e}")
        print()
    print(f"=== done. files in {WEB_PUBLIC} ===")


if __name__ == "__main__":
    main()
