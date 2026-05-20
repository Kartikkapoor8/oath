// stage 8: elevenlabs synthesis via raw fetch. mirrors pipeline/v2/stage_8_synthesize.py
//
// returns a base64 data url instead of a file path — the data url goes directly to
// <audio src=...> in the browser. for production scale this would move to vercel blob storage,
// but for the demo, inline base64 is plenty (audio is typically 600-1200 KB).

import 'server-only';
import { VOICE_PRESET_MAP, getVoiceSettings } from './voice-settings';
import type { SynthesisResult, VoicePreset } from './types';

const MODEL_ID = 'eleven_flash_v2_5';

export async function synthesize(
  script: string,
  voicePreset: VoicePreset,
  mode: string
): Promise<SynthesisResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

  const preset = VOICE_PRESET_MAP[voicePreset];
  if (!preset) throw new Error(`invalid voice preset: ${voicePreset}`);
  const voiceSettings = getVoiceSettings(mode);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${preset.id}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: script,
      model_id: MODEL_ID,
      voice_settings: voiceSettings,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`elevenlabs returned ${res.status}: ${errText.slice(0, 300)}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const bytes = arrayBuffer.byteLength;
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const dataUrl = `data:audio/mpeg;base64,${base64}`;

  // 128 kbps mp3 ≈ 16 kB/s
  const estimatedDuration = bytes / ((128 * 1024) / 8);

  return {
    audio_base64: dataUrl,
    audio_bytes: bytes,
    voice_preset: voicePreset,
    voice_id: preset.id,
    voice_label: preset.label,
    estimated_duration_seconds: Math.round(estimatedDuration * 10) / 10,
    voice_settings_used: voiceSettings,
  };
}

