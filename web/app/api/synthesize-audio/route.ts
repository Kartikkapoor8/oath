import { NextResponse } from 'next/server';
import { synthesizeAudio, VOICE_PRESET_MAP, type VoicePreset } from '@/lib/engine-bridge';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { script, voice_preset } = body ?? {};

    if (typeof script !== 'string' || script.trim().length === 0) {
      return NextResponse.json({ error: 'script is required (string)' }, { status: 422 });
    }
    if (script.length > 2000) {
      return NextResponse.json({ error: 'script exceeds 2000 char limit' }, { status: 422 });
    }
    const resolvedVoice: VoicePreset =
      voice_preset && voice_preset in VOICE_PRESET_MAP ? (voice_preset as VoicePreset) : 'the_closer';

    const result = await synthesizeAudio({
      script,
      voicePreset: resolvedVoice,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
