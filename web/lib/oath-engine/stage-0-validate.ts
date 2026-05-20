// stage 0: pure logic input validation. mirrors pipeline/v2/stage_0_validate.py

import 'server-only';
import promptsJson from './prompts.json';
import { VOICE_PRESET_MAP } from './voice-settings';
import type { PipelineInputs, ValidatedInputs, Mode, Variant, VoicePreset } from './types';

const LENGTH_LIMITS = {
  intent: 100,
  first_action: 80,
  hero: 60,
  phrase: 120,
} as const;

const VALID_MODES = promptsJson.valid_modes as readonly string[];
const VALID_VARIANTS = promptsJson.valid_variants as readonly string[];

export function validateAndNormalize(inputs: PipelineInputs): ValidatedInputs {
  for (const field of ['mode', 'intent', 'first_action', 'hero', 'phrase'] as const) {
    const v = inputs[field];
    if (typeof v !== 'string') {
      throw new Error(`input '${field}' is required and must be a string`);
    }
  }

  const intent = inputs.intent.trim();
  const first_action = inputs.first_action.trim();
  const hero = inputs.hero.trim();
  const phrase = inputs.phrase.trim();
  const mode = (inputs.mode as string).trim().toLowerCase();
  const variant = ((inputs.variant as string) || 'default').trim().toLowerCase();
  const voice = ((inputs.voice as string) || 'the_closer').trim().toLowerCase();

  if (!intent) throw new Error("input 'intent' cannot be empty");
  if (!first_action) throw new Error("input 'first_action' cannot be empty");
  if (!hero) throw new Error("input 'hero' cannot be empty");
  if (!phrase) throw new Error("input 'phrase' cannot be empty");

  if (intent.length > LENGTH_LIMITS.intent)
    throw new Error(`input 'intent' is ${intent.length} chars, exceeds limit of ${LENGTH_LIMITS.intent}`);
  if (first_action.length > LENGTH_LIMITS.first_action)
    throw new Error(
      `input 'first_action' is ${first_action.length} chars, exceeds limit of ${LENGTH_LIMITS.first_action}`
    );
  if (hero.length > LENGTH_LIMITS.hero)
    throw new Error(`input 'hero' is ${hero.length} chars, exceeds limit of ${LENGTH_LIMITS.hero}`);
  if (phrase.length > LENGTH_LIMITS.phrase)
    throw new Error(`input 'phrase' is ${phrase.length} chars, exceeds limit of ${LENGTH_LIMITS.phrase}`);

  if (!VALID_MODES.includes(mode))
    throw new Error(`mode must be one of ${VALID_MODES.join(', ')}, got: ${mode}`);
  if (!VALID_VARIANTS.includes(variant))
    throw new Error(`variant must be one of ${VALID_VARIANTS.join(', ')}, got: ${variant}`);
  if (!(voice in VOICE_PRESET_MAP))
    throw new Error(`voice must be one of ${Object.keys(VOICE_PRESET_MAP).join(', ')}, got: ${voice}`);

  const targetRaw = inputs.target_duration_seconds;
  const target = typeof targetRaw === 'number' && targetRaw >= 30 && targetRaw <= 120 ? targetRaw : 60;

  // lightweight hero capitalization if input is all-lowercase
  const heroNormalized =
    hero === hero.toLowerCase()
      ? hero.split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : '')).join(' ')
      : hero;

  return {
    mode: mode as Mode,
    intent,
    first_action,
    hero: heroNormalized,
    phrase,
    variant: variant as Variant,
    voice: voice as VoicePreset,
    target_duration_seconds: target,
  };
}
