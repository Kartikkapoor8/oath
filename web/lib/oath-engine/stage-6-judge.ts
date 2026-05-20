// stage 6: llm-as-judge final scoring (1 claude call). mirrors pipeline/v2/stage_6_judge.py

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import promptsJson from './prompts.json';
import { stripJsonFences } from './utils';
import type { ValidatedInputs, Judgment } from './types';

const MODEL_ID = 'claude-sonnet-4-6';
const MAX_TOKENS = 500;
const TEMPERATURE = 0.3;

export async function judgeFinalScript(script: string, inputs: ValidatedInputs): Promise<Judgment> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });
  const userPrompt = `USER INPUTS (so you know who the script is for):
mode: ${inputs.mode}
intent: "${inputs.intent}"
first_action: "${inputs.first_action}"
hero: ${inputs.hero}
grounding_phrase: "${inputs.phrase}"

THE SCRIPT TO JUDGE:
---
${script}
---

Give the final 1-10 score and the binary get-out-of-bed verdict. JSON only.`;

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: promptsJson.system_prompts.judge,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const firstBlock = response.content[0];
  const raw = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
  const parsed = JSON.parse(stripJsonFences(raw));

  let score = typeof parsed.final_quality_score === 'number' ? parsed.final_quality_score : 0;
  score = Math.max(1, Math.min(10, score));

  return {
    final_quality_score: Math.round(score * 10) / 10,
    would_get_user_out_of_bed: Boolean(parsed.would_get_user_out_of_bed),
    judge_notes: parsed.judge_notes ?? '',
  };
}
