import { NextResponse } from 'next/server';
import {
  generateScript,
  VALID_MODES,
  VALID_VARIANTS,
  type Mode,
  type Variant,
} from '@/lib/engine-bridge';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, intent, first_action, hero, phrase, variant, target_duration_seconds } = body ?? {};

    if (!VALID_MODES.includes(mode)) {
      return NextResponse.json(
        { error: `mode must be one of ${VALID_MODES.join(', ')}` },
        { status: 422 }
      );
    }
    if (typeof intent !== 'string' || intent.trim().length === 0) {
      return NextResponse.json({ error: 'intent is required (string)' }, { status: 422 });
    }
    if (typeof first_action !== 'string' || first_action.trim().length === 0) {
      return NextResponse.json({ error: 'first_action is required (string)' }, { status: 422 });
    }
    if (typeof hero !== 'string' || hero.trim().length === 0) {
      return NextResponse.json({ error: 'hero is required (string)' }, { status: 422 });
    }
    if (typeof phrase !== 'string' || phrase.trim().length === 0) {
      return NextResponse.json({ error: 'phrase is required (string)' }, { status: 422 });
    }
    if (intent.length > 200 || first_action.length > 200 || hero.length > 80 || phrase.length > 120) {
      return NextResponse.json({ error: 'one or more inputs exceed length limit' }, { status: 422 });
    }
    const resolvedVariant: Variant =
      variant && VALID_VARIANTS.includes(variant) ? variant : 'default';

    const result = await generateScript({
      mode: mode as Mode,
      intent,
      firstAction: first_action,
      hero,
      groundingPhrase: phrase,
      variant: resolvedVariant,
      targetDurationSeconds: typeof target_duration_seconds === 'number' ? target_duration_seconds : 60,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg.includes('ANTHROPIC_API_KEY') ? 500 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
