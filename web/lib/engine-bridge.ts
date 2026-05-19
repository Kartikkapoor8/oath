// engine-bridge.ts — TypeScript port of pipeline/generate_script.py + synthesize_audio.py
//
// single source of truth for the 3-layer prompt, banned phrase list, validation logic,
// and elevenlabs synthesis settings. mirrors the python engine exactly so that the web
// demo runs the same engine the ios app will.

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

export const MODEL_ID = 'claude-sonnet-4-6';
const MAX_TOKENS = 800;
const TEMPERATURE = 0.7;
const WORDS_PER_SECOND = 2.5;

export const VALID_MODES = ['hardest_work', 'gym_now', 'grounding_phrases'] as const;
export type Mode = (typeof VALID_MODES)[number];

export const VALID_VARIANTS = [
  'default',
  'more_clipped',
  'more_narrative',
  'hero_anchor_heavy',
  'grounding_heavy',
] as const;
export type Variant = (typeof VALID_VARIANTS)[number];

export const BANNED_PHRASES = [
  'rise and grind',
  'champion',
  'you got this',
  'you can do it',
  "let's go",
  "let's gooo",
  'today is a new day',
  'today is your day',
  'your future self will thank you',
  'rise up',
  'wake up and conquer',
  'endorphins',
  "you'll feel great",
  'mindfulness',
  'presence',
  'be here now',
  'channel your inner',
  'as kobe said',
  'as goggins said',
  'as jordan said',
];

const LAYER_1 = `You are writing a morning ritual script for OATH, an app that plays a personalized 45-90 second audio piece the moment a user dismisses their morning alarm.

The user is in bed, half-awake, vulnerable, one thumb from TikTok. Your script has to be a better choice than the feed. You have 130 to 200 words to get them out of bed and into their hardest task.

This is not a motivational speech. It is a ritual. It is spare, specific, and physical. It speaks the user's exact commitment back to them. It does not flatter. It does not console. It commands.

Banned phrases (using any of these is a hard failure — do not use these words or phrasings in any form):
- "rise and grind"
- "champion"
- "you got this"
- "you can do it"
- "let's go" / "let's gooo"
- "today is a new day"
- "today is your day"
- "your future self will thank you"
- "rise up"
- "wake up and conquer"
- "endorphins"
- "you'll feel great"
- "mindfulness"
- "presence"
- "be here now"
- "channel your inner [anyone]"
- any direct quote attributed to a real person (e.g. "as kobe said...")
- any rhetorical question (no question marks in the output)

Reference heroes by their concrete habits — a specific time, a specific number, a specific place — never by invented quotes or generic platitudes about excellence.`;

const MODE_PROMPTS: Record<Mode, string> = {
  hardest_work: `Mode: HARDEST WORK FIRST.

Tone: clipped, declarative, professional but emotionally charged. Short sentences. Verbs over adjectives.

Structural arc (must hit in order):
1. Groggy reality (1 line). Acknowledge what time it is or that they just woke up.
2. Quote the user's intent verbatim. Use the phrase "you swore" or "you said" to anchor to the night-before commitment.
3. The hero anchor — a concrete habit (4am, empty room, no audience, specific number of reps or hours). Not a quote. Not a platitude.
4. The grounding phrase, verbatim, in its own beat.
5. A time-boxed runway and physical instruction ("forty-five minutes. phone face down.").
6. The command. Single verb. Period. No question.`,

  gym_now: `Mode: GYM NOW.

Tone: kinetic, charged, physically energizing. Short sentences. Imperatives at the body, not the mind.

Structural arc (must hit in order):
1. A body cue. A physical action the user should be doing while listening ("up. shorts on. water.").
2. The hero anchor — a physical habit at an extreme time (kobe at 4am, jordan's 500 free throws, goggins' miles). Concrete and specific.
3. Quote the user's intent verbatim. Their committed first action goes here.
4. The grounding phrase, verbatim.
5. The command. A door, a rep count, a route. Single physical action.

Bans specific to this mode:
- No "endorphins" or "you'll feel great"
- No "your future self will thank you"
- No long-term benefit framing — at 6am only the next 5 minutes exist`,

  grounding_phrases: `Mode: GROUNDING PHRASES.

Tone: spare, repetition-heavy, almost liturgical. Low affect, high weight. Silence is content — use line breaks as pauses.

Structural arc:
1. The grounding phrase, alone on its own line.
2. A short beat (line break).
3. The grounding phrase, again. Same words.
4. Another short beat.
5. The user's intent verbatim. Spoken once, slowly.
6. The grounding phrase, one more time.
7. The command. Single verb.

Specific rules for this mode:
- Do not explain the phrase. Do not paraphrase it. The moment you explain it, it stops being the user's.
- The hero is OPTIONAL in this mode. If used, only as a single concrete moment in one beat between phrase repetitions. Default to omitting the hero entirely if the phrase is strong.
- Pauses are part of the script. Use line breaks generously.`,
};

const VARIANT_OVERLAYS: Record<Variant, string> = {
  default: '',
  more_clipped: `Variant: MORE CLIPPED.
Make every sentence shorter. Cut every word that isn't load-bearing. Aim for 130 words, not 200. Imperatives only. No adverbs.`,
  more_narrative: `Variant: MORE NARRATIVE.
Allow one or two slightly longer story-shaped beats, especially in the hero anchor. The hero moment can be 2-3 sentences instead of 1. Stay within 200 words total. Do not become a speech.`,
  hero_anchor_heavy: `Variant: HERO ANCHOR HEAVY.
The hero anchor expands to 3-4 sentences with vivid concrete detail — time, place, number, scene. Still no invented quotes. The anchor should feel like a documentary clip, not a quote-stitched motivational poster.`,
  grounding_heavy: `Variant: GROUNDING HEAVY.
Repeat the user's grounding phrase 3 times across the script (instead of once). Slow the cadence overall. Use more line breaks. The phrase carries the script.`,
};

export function buildSystemPrompt(mode: Mode, variant: Variant): string {
  const parts: string[] = [LAYER_1, MODE_PROMPTS[mode]];
  const overlay = VARIANT_OVERLAYS[variant];
  if (overlay && overlay.trim().length > 0) parts.push(overlay);
  return parts.join('\n\n');
}

export function buildUserPrompt(args: {
  mode: Mode;
  variant: Variant;
  intent: string;
  firstAction: string;
  hero: string;
  groundingPhrase: string;
  targetDurationSeconds: number;
}): string {
  const targetWordCount = Math.floor(args.targetDurationSeconds * WORDS_PER_SECOND);
  return `Generate the OATH ritual script using:

mode: ${args.mode}
variant: ${args.variant}
user's intent (the hardest task they swore last night they'd tackle this morning): "${args.intent}"
user's first action (what they'll do in the first 5 minutes): "${args.firstAction}"
user's hero (reference by concrete habit, never by invented quote): ${args.hero}
user's grounding phrase (use verbatim, do not paraphrase): "${args.groundingPhrase}"

Target read duration: ${args.targetDurationSeconds} seconds (~${targetWordCount} words at 150 wpm).

Output as JSON:
{
  "script": "the spoken text, with line breaks for natural pauses",
  "estimated_duration_seconds": <integer>,
  "word_count": <integer>
}

Output the JSON only. No preamble. No explanation. No markdown fence.`;
}

export function countWords(text: string): number {
  const matches = text.match(/\b\w+\b/g);
  return matches ? matches.length : 0;
}

export function findBannedPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.filter((p) => lower.includes(p));
}

function parseJsonResponse(raw: string): { script: string; estimated_duration_seconds?: number; word_count?: number } {
  let s = raw.trim();
  if (s.startsWith('```')) {
    const lines = s.split('\n');
    const first = lines[0] ?? '';
    const stripped = lines.slice(1);
    if (stripped.length && stripped[stripped.length - 1].trim() === '```') stripped.pop();
    s = stripped.join('\n').trim();
    // ignore the first fence line; pulled to satisfy linter
    void first;
  }
  return JSON.parse(s);
}

export interface GenerateScriptArgs {
  mode: Mode;
  intent: string;
  firstAction: string;
  hero: string;
  groundingPhrase: string;
  variant?: Variant;
  targetDurationSeconds?: number;
}

export interface GenerateScriptResult {
  script: string;
  word_count: number;
  estimated_duration_seconds: number;
  mode: Mode;
  variant: Variant;
  model_used: string;
  violations: string[];
}

export async function generateScript(args: GenerateScriptArgs): Promise<GenerateScriptResult> {
  const variant = args.variant ?? 'default';
  const targetDurationSeconds = args.targetDurationSeconds ?? 60;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt(args.mode, variant);
  let userPrompt = buildUserPrompt({
    mode: args.mode,
    variant,
    intent: args.intent,
    firstAction: args.firstAction,
    hero: args.hero,
    groundingPhrase: args.groundingPhrase,
    targetDurationSeconds,
  });

  let script = '';
  let wordCount = 0;
  let violations: string[] = [];

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const firstBlock = response.content[0];
    const raw = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';

    try {
      const parsed = parseJsonResponse(raw);
      script = (parsed.script ?? '').trim();
    } catch (e) {
      if (attempt === 0) {
        userPrompt =
          userPrompt +
          '\n\nPREVIOUS ATTEMPT FAILED: output was not valid JSON. OUTPUT VALID JSON ONLY. NO MARKDOWN FENCE. NO PREAMBLE.';
        continue;
      }
      throw new Error(`failed to parse JSON after 2 attempts: ${e instanceof Error ? e.message : String(e)}`);
    }

    wordCount = countWords(script);
    violations = findBannedPhrases(script);
    // grounding_phrases has a tighter range (sparse by design); others use 100-220.
    const minWords = args.mode === 'grounding_phrases' ? 80 : 100;
    const maxWords = args.mode === 'grounding_phrases' ? 170 : 220;
    const wordCountOk = wordCount >= minWords && wordCount <= maxWords;
    const noViolations = violations.length === 0;
    if (wordCountOk && noViolations) break;

    if (attempt === 0) {
      const issues: string[] = [];
      if (!wordCountOk) {
        const targetWords = Math.floor(targetDurationSeconds * WORDS_PER_SECOND);
        issues.push(`Word count was ${wordCount}, must be ${minWords}-${maxWords} (target ~${targetWords}).`);
      }
      if (violations.length) {
        issues.push(`Used banned phrases: ${JSON.stringify(violations)}. Remove all of these in the rewrite.`);
      }
      userPrompt =
        userPrompt +
        '\n\nPREVIOUS ATTEMPT FAILED: ' +
        issues.join(' ') +
        ' Try again. Same structure, same inputs, fix only the issues above.';
    }
  }

  return {
    script,
    word_count: wordCount,
    estimated_duration_seconds: Math.round(wordCount / WORDS_PER_SECOND),
    mode: args.mode,
    variant,
    model_used: MODEL_ID,
    violations,
  };
}

// --- elevenlabs synthesis ---

export const VOICE_PRESET_MAP: Record<
  string,
  { id: string; label: string; description: string; reference: string }
> = {
  the_closer: {
    id: 'pNInz6obpgDQGcFmaJgB',
    label: 'Adam',
    description: 'deep, slow, measured. for the hardest work of the day, when you need someone in your corner.',
    reference: 'calm, authoritative — harvey specter energy',
  },
  the_drill: {
    id: 'VR6AewLTigWG4xSOukaG',
    label: 'Arnold',
    description: 'sharp, clipped, no-bullshit. for the body, not the mind. when negotiation with the bed is not an option.',
    reference: 'sharp, clipped — drill sergeant energy',
  },
  the_stoic: {
    id: 'onwK4e9ZLuTAKqWW03F9',
    label: 'Daniel',
    description: 'measured, low-affect, philosophical. for calm starts. for mornings that need spaciousness, not force.',
    reference: 'measured, philosophical — marcus aurelius energy',
  },
  the_coach: {
    id: 'nPczCjzI2devNBz1zQrb',
    label: 'Brian',
    description: 'warm, urgent, mentor energy. for narrative mornings where the script needs to feel like someone who has been there.',
    reference: 'warm, urgent mentor — phil jackson energy',
  },
  the_friend: {
    id: 'ErXwobaYiN019PkySvjV',
    label: 'Antoni',
    description: 'conversational peer. for grounding phrases mode where authority would feel like distance.',
    reference: 'conversational peer — your closest friend energy',
  },
};

export type VoicePreset = keyof typeof VOICE_PRESET_MAP;

export interface SynthesizeAudioArgs {
  script: string;
  voicePreset?: VoicePreset;
  modelId?: string;
}

export interface SynthesizeAudioResult {
  audio_base64: string; // data URL ready for <audio src=...>
  audio_bytes: number;
  voice_preset: VoicePreset;
  voice_id: string;
  voice_label: string;
  model_id: string;
  estimated_duration_seconds: number;
}

export async function synthesizeAudio(args: SynthesizeAudioArgs): Promise<SynthesizeAudioResult> {
  const voicePreset = args.voicePreset ?? 'the_closer';
  const modelId = args.modelId ?? 'eleven_flash_v2_5';
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

  const preset = VOICE_PRESET_MAP[voicePreset];
  if (!preset) throw new Error(`invalid voice preset: ${voicePreset}`);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${preset.id}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: args.script,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
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

  // mp3 at 128kbps ~ 16kB/s
  const estimatedDurationSeconds = bytes / (128 * 1024 / 8);

  return {
    audio_base64: dataUrl,
    audio_bytes: bytes,
    voice_preset: voicePreset,
    voice_id: preset.id,
    voice_label: preset.label,
    model_id: modelId,
    estimated_duration_seconds: Math.round(estimatedDurationSeconds * 10) / 10,
  };
}
