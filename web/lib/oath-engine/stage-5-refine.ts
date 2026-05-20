// stage 5: refinement (conditional, 1 claude call). mirrors pipeline/v2/stage_5_refine.py

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { stripJsonFences, countWords, buildBaseSystemPrompt } from './utils';
import fewShotJson from './few-shot-examples.json';
import type { ValidatedInputs, AnalysisPlan, Candidate, Critique, Refinement } from './types';

const MODEL_ID = 'claude-sonnet-4-6';
const MAX_TOKENS = 1000;
const TEMPERATURE = 0.5;
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

function buildUserPrompt(
  winner: Candidate,
  critique: Critique,
  inputs: ValidatedInputs,
  plan: AnalysisPlan
): string {
  const targetWords = Math.floor(inputs.target_duration_seconds * WORDS_PER_SECOND);
  const weakest = critique.weakest_axis;
  const weakestScore = critique.scores[weakest];
  const overall = critique.overall_score;

  return `USER INPUTS:
mode: ${inputs.mode}
intent: "${inputs.intent}"
first_action: "${inputs.first_action}"
hero: ${inputs.hero}
grounding_phrase: "${inputs.phrase}"

STRUCTURAL PLAN:
- tone_notes: ${plan.tone_notes}
- hero_anchor_strategy: ${plan.hero_anchor_strategy}
- grounding_phrase_placement: ${plan.grounding_phrase_placement}
- command_structure: ${plan.command_structure}

PREVIOUS ATTEMPT (this is the previous best candidate, but it scored below threshold):
---
${winner.script}
---

The previous attempt scored ${overall}/10 overall.
Weakest axis: ${weakest} (${weakestScore}/10).
Critique notes: ${critique.critique_notes}

REGENERATE the script with specific attention to fixing the weakest axis while preserving the other strengths. Keep what worked about the structural arc; fix what was specifically flagged.

TARGET: ${inputs.target_duration_seconds} seconds (~${targetWords} words at 150 wpm).

Output as JSON:
{
  "script": "the refined spoken text",
  "estimated_duration_seconds": <integer>,
  "what_was_fixed": "1 sentence on what specifically changed vs the previous attempt"
}

Output the JSON only. No preamble. No explanation. No markdown fence.`;
}

export async function refineScript(
  winner: Candidate,
  critique: Critique,
  inputs: ValidatedInputs,
  plan: AnalysisPlan
): Promise<Refinement> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: buildSystemPrompt(inputs),
    messages: [{ role: 'user', content: buildUserPrompt(winner, critique, inputs, plan) }],
  });
  const firstBlock = response.content[0];
  const raw = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
  const parsed = JSON.parse(stripJsonFences(raw));
  const refined: string = (parsed.script ?? '').trim();
  return {
    refined_script: refined,
    word_count: countWords(refined),
    what_was_fixed: parsed.what_was_fixed ?? '',
  };
}
