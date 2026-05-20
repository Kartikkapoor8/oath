// stage 1: pre-generation analysis (1 claude call). mirrors pipeline/v2/stage_1_analyze.py

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import promptsJson from './prompts.json';
import { stripJsonFences } from './utils';
import type { ValidatedInputs, AnalysisPlan } from './types';

const MODEL_ID = 'claude-sonnet-4-6';
const MAX_TOKENS = 800;
const TEMPERATURE = 0.4;

export async function analyzeAndPlan(inputs: ValidatedInputs): Promise<AnalysisPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });
  const systemPrompt = promptsJson.system_prompts.analyze;
  const userPrompt = `User inputs:
- mode: ${inputs.mode}
- intent: "${inputs.intent}"
- first_action: "${inputs.first_action}"
- hero: ${inputs.hero}
- grounding_phrase: "${inputs.phrase}"
- variant: ${inputs.variant}

Produce the structural plan as JSON only.`;

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const firstBlock = response.content[0];
  const raw = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
  const parsed = JSON.parse(stripJsonFences(raw));

  return {
    tone_notes: parsed.tone_notes ?? '',
    hero_anchor_strategy: parsed.hero_anchor_strategy ?? '',
    grounding_phrase_placement: parsed.grounding_phrase_placement ?? '',
    command_structure: parsed.command_structure ?? '',
    estimated_complexity: parsed.estimated_complexity ?? 'medium',
  };
}
