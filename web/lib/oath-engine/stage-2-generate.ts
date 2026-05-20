// stage 2: parallel candidate generation (3 claude calls). mirrors pipeline/v2/stage_2_generate.py

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { stripJsonFences, countWords, findBannedPhrases, estimateDurationSeconds, buildBaseSystemPrompt } from './utils';
import fewShotJson from './few-shot-examples.json';
import type { ValidatedInputs, AnalysisPlan, Candidate } from './types';

const MODEL_ID = 'claude-sonnet-4-6';
const MAX_TOKENS = 1000;
const TEMPERATURES = [0.6, 0.8, 1.0];
const WORDS_PER_SECOND = 2.5;

interface FewShotExample {
  intent: string;
  first_action: string;
  hero: string;
  phrase: string;
  script: string;
  why_strong: string;
}

function renderFewShot(mode: string): string {
  const examples = fewShotJson as unknown as Record<string, FewShotExample | undefined>;
  const ex = examples[mode];
  if (!ex) return '';
  return (
    `EXAMPLE OF A STRONG ${mode.toUpperCase()} SCRIPT:\n\n` +
    `For these inputs:\n` +
    `  intent: "${ex.intent}"\n` +
    `  first_action: "${ex.first_action}"\n` +
    `  hero: ${ex.hero}\n` +
    `  phrase: "${ex.phrase}"\n\n` +
    `A strong script is:\n\n` +
    `---\n${ex.script}\n---\n\n` +
    `Why this works: ${ex.why_strong}\n\n` +
    `Match this caliber for the user inputs below. Do not copy phrases from the example; use it as a quality bar.`
  );
}

function buildSystemPrompt(inputs: ValidatedInputs): string {
  const base = buildBaseSystemPrompt(inputs.mode, inputs.variant);
  const fewShot = renderFewShot(inputs.mode);
  return fewShot ? base + '\n\n' + fewShot : base;
}

function buildUserPrompt(inputs: ValidatedInputs, plan: AnalysisPlan): string {
  const targetWords = Math.floor(inputs.target_duration_seconds * WORDS_PER_SECOND);
  return `USER INPUTS:
mode: ${inputs.mode}
variant: ${inputs.variant}
user's intent (the hardest task they swore last night they'd tackle this morning): "${inputs.intent}"
user's first action (what they'll do in the first 5 minutes): "${inputs.first_action}"
user's hero (reference by concrete habit, never by invented quote): ${inputs.hero}
user's grounding phrase (use verbatim, do not paraphrase): "${inputs.phrase}"

STRUCTURAL PLAN FROM PRE-ANALYSIS (follow this plan tightly):
- tone_notes: ${plan.tone_notes}
- hero_anchor_strategy: ${plan.hero_anchor_strategy}
- grounding_phrase_placement: ${plan.grounding_phrase_placement}
- command_structure: ${plan.command_structure}

TARGET: ${inputs.target_duration_seconds} seconds (~${targetWords} words at 150 wpm).

Output as JSON:
{
  "script": "the spoken text, with line breaks for natural pauses",
  "estimated_duration_seconds": <integer>,
  "internal_self_check": <integer 1-10, your honest confidence that this script hits all 5 structural beats>
}

Output the JSON only. No preamble. No explanation. No markdown fence.`;
}

async function generateOne(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  candidate_id: number
): Promise<Candidate> {
  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const firstBlock = response.content[0];
  const raw = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
  const parsed = JSON.parse(stripJsonFences(raw));
  const script: string = (parsed.script ?? '').trim();
  const wc = countWords(script);
  return {
    candidate_id,
    script,
    word_count: wc,
    estimated_duration_seconds: estimateDurationSeconds(wc),
    internal_self_check: parsed.internal_self_check ?? null,
    temperature,
    violations: findBannedPhrases(script),
  };
}

export async function generateCandidates(
  inputs: ValidatedInputs,
  plan: AnalysisPlan,
  n = 3
): Promise<Candidate[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt(inputs);
  const userPrompt = buildUserPrompt(inputs, plan);
  const temps = Array.from({ length: n }, (_, i) => TEMPERATURES[i % TEMPERATURES.length]);

  const tasks = temps.map((t, i) =>
    generateOne(client, systemPrompt, userPrompt, t, i + 1).catch((err) => ({
      candidate_id: i + 1,
      script: '',
      word_count: 0,
      estimated_duration_seconds: 0,
      internal_self_check: null,
      temperature: t,
      violations: [] as string[],
      error: err instanceof Error ? err.message : String(err),
    }))
  );
  return (await Promise.all(tasks)) as Candidate[];
}
