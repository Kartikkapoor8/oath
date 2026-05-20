"""stage 8 — audio synthesis with per-mode voice settings.

uses the elevenlabs python client. settings are tuned per mode (see voice_settings.py).
"""

from pathlib import Path
from typing import Iterator

from elevenlabs.client import ElevenLabs

from _env import require_elevenlabs_key
from voice_settings import VOICE_PRESET_MAP, get_voice_settings

DEFAULT_MODEL_ID = "eleven_flash_v2_5"


def synthesize(script: str, voice_preset: str, mode: str, output_path: str, model_id: str = DEFAULT_MODEL_ID) -> dict:
    if voice_preset not in VOICE_PRESET_MAP:
        raise ValueError(f"voice_preset must be one of {list(VOICE_PRESET_MAP.keys())}, got: {voice_preset}")

    voice_id, voice_label = VOICE_PRESET_MAP[voice_preset]
    voice_settings = get_voice_settings(mode)

    api_key = require_elevenlabs_key()
    client = ElevenLabs(api_key=api_key)

    audio_iter: Iterator[bytes] = client.text_to_speech.convert(
        voice_id=voice_id,
        model_id=model_id,
        text=script,
        voice_settings=voice_settings,
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

    bytes_per_second = 128 * 1024 / 8  # 128kbps mp3
    estimated_duration = audio_bytes / bytes_per_second

    return {
        "output_path": str(output_path_p),
        "voice_preset": voice_preset,
        "voice_id": voice_id,
        "voice_label": voice_label,
        "model_id": model_id,
        "voice_settings_used": voice_settings,
        "audio_bytes": audio_bytes,
        "estimated_duration_seconds": round(estimated_duration, 1),
    }
