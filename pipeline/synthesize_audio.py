"""synthesize_audio.py — OATH text-to-audio via elevenlabs flash v2.5.

maps the 5 archetype voice presets to elevenlabs default voice ids and produces
an mp3 from the supplied script. uses default voices that ship with every
elevenlabs account so this works on day 1 of any new key.
"""

import os
from pathlib import Path
from typing import Iterator

from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parent.parent
# override=True so .env.local wins over any stale empty values in the shell env.
load_dotenv(REPO_ROOT / ".env.local", override=True)

# voice ids below are elevenlabs default voices available on all accounts (no library subscription needed).
# rationale per archetype is in the inline comments. swap any of these in prompt 3 after the morning test
# reveals what voice character actually works at 6am.
VOICE_PRESET_MAP = {
    # adam: deep american male, even tempo, authoritative without being aggressive. closest default to the "closer" archetype.
    "the_closer":  ("pNInz6obpgDQGcFmaJgB", "Adam"),
    # arnold: harder edge, more clipped, more force. matches the drill instructor energy of the gym mode.
    "the_drill":   ("VR6AewLTigWG4xSOukaG", "Arnold"),
    # daniel: british cadence, measured and philosophical, low affect. fits the stoic mode.
    "the_stoic":   ("onwK4e9ZLuTAKqWW03F9", "Daniel"),
    # brian: mature american warmth, mentor-tone. fits the coach archetype for greats mode.
    "the_coach":   ("nPczCjzI2devNBz1zQrb", "Brian"),
    # antoni: conversational peer energy, less authoritarian. fits the friend archetype for grounding mode.
    "the_friend":  ("ErXwobaYiN019PkySvjV", "Antoni"),
}

DEFAULT_MODEL_ID = "eleven_flash_v2_5"
DEFAULT_VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.3,
    "use_speaker_boost": True,
}


def _require_api_key() -> str:
    api_key = os.getenv("ELEVENLABS_API_KEY", "")
    if not api_key or api_key.endswith("...") or len(api_key) < 20:
        raise RuntimeError(
            "ELEVENLABS_API_KEY missing or placeholder. "
            f"Edit {REPO_ROOT / '.env.local'} and paste a real key (starts with sk_)."
        )
    return api_key


def synthesize_audio(
    script: str,
    output_path: str,
    voice_preset: str = "the_closer",
    model_id: str = DEFAULT_MODEL_ID,
) -> dict:
    if voice_preset not in VOICE_PRESET_MAP:
        raise ValueError(f"voice_preset must be one of {list(VOICE_PRESET_MAP.keys())}, got: {voice_preset}")

    voice_id, voice_label = VOICE_PRESET_MAP[voice_preset]

    api_key = _require_api_key()
    client = ElevenLabs(api_key=api_key)

    audio_iter: Iterator[bytes] = client.text_to_speech.convert(
        voice_id=voice_id,
        model_id=model_id,
        text=script,
        voice_settings=DEFAULT_VOICE_SETTINGS,
        output_format="mp3_44100_128",
    )

    output_path_p = Path(output_path)
    output_path_p.parent.mkdir(parents=True, exist_ok=True)

    audio_bytes = 0
    with open(output_path_p, "wb") as f:
        for chunk in audio_iter:
            if chunk:
                f.write(chunk)
                audio_bytes += len(chunk)

    # mp3 at 128kbps is ~16kB/s.
    bytes_per_second = 128 * 1024 / 8
    estimated_duration = audio_bytes / bytes_per_second

    return {
        "output_path": str(output_path_p),
        "voice_preset": voice_preset,
        "voice_id": voice_id,
        "voice_label": voice_label,
        "model_id": model_id,
        "audio_bytes": audio_bytes,
        "estimated_duration_seconds": round(estimated_duration, 1),
    }


if __name__ == "__main__":
    # smoke test: synthesize a single hardcoded line to verify api key + voice id pipeline works.
    out = synthesize_audio(
        script="this is a smoke test of the oath audio pipeline. if you hear this, the closer voice is wired up correctly.",
        output_path=str(REPO_ROOT / "experiments" / "02-voice-synthesis" / "samples" / "_smoke_test.mp3"),
    )
    print(out)
