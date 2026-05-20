// stage 3: parallel critique pass (3 claude calls). mirrors pipeline/v2/stage_3_critique.py

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { stripJsonFences } from './utils';
import rubricJson from './rubric.json';
import type { ValidatedInputs, Candidate, Critique, RubricScores } from './types';

const MODEL_ID = 'claude-sonnet-4-6';
const MAX_TOKENS = 800;
const TEMPERATURE = 0.2;

const AXIS_NAMES = Object.keys(rubricJson.axes) as Array<keyof RubricScores>;
const TOTAL_WEIGHT = AXIS_NAMES.reduce(
  (sum, name) => sum + ((rubricJson.axes as Record<string, { weight: number }>)[name as string].weight),
  0
);

function rubricAsPromptText(): string {
  const axes = rubricJson.axes as Record<string, { weight: number; description: string; anchors: Record<string, string> }>;
  const lines: string[] = [];
  for (const [name, axis] of Object.entries(axes)) {
    lines.push(`- ${name} (weight ${axis.weight}): ${axis.description}`);
    const sortedScores = Object.keys(axis.anchors).map(Number).sort((a, b) => b - a);
    for (const score of sortedScores) {
      lines.push(`    ${score}/10: ${axis.anchors[String(score)]}`);
    }
  }
  return lines.join('\n');
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function computeOverall(scores: RubricScores): number {
  let weighted = 0;
  for (const name of AXIS_NAMES) {
    const axis = (rubricJson.axes as Record<string, { weight: number }>)[name as string];
    weighted += (scores[name] ?? 0) * axis.weight;
  }
  return Math.round((weighted / TOTAL_WEIGHT) * 100) / 100;
}

function findWeakest(scores: RubricScores): keyof RubricScores {
  let minName = AXIS_NAMES[0];
  let minScore = scores[minName];
  for (const name of AXIS_NAMES) {
    if (scores[name] < minScore) {
      minScore = scores[name];
      minName = name;
    }
  }
  return minName;
}

const CRITIQUE_SYSTEM_PROMPT = `You are the critique layer for OATH's alarm ritual generation pipeline. Your job is to evaluate a generated script against a 6-axis rubric and identify the weakest axis for refinement.

You will receive:
1. The user's inputs (mode, intent, first action, hero, phrase)
2. A candidate script
3. The rubric below

Score each axis 1-10. Provide the overall weighted score. Identify the weakest axis. Write 2-3 sentences of critique notes that explain WHY the weakest axis scored low and what specifically needs to change.

Be honest. If the script is mediocre, score it accurately. Inflated scores produce inflated retries.

THE RUBRIC:
${rubricAsPromptText()}

Output JSON only:
{
  "scores": {
    "specificity": <1-10>,
    "command_density": <1-10>,
    "structural_arc_completeness": <1-10>,
    "cliche_freedom": <1-10>,
    "hero_anchor_concreteness": <1-10>,
    "voice_directness": <1-10>
  },
  "weakest_axis": "<axis name>",
  "critique_notes": "2-3 sentences explaining why the weakest axis scored low and what to fix"
}`;

function buildUserPrompt(candidate: Candidate, inputs: ValidatedInputs): string {
  return `USER INPUTS:
mode: ${inputs.mode}
intent: "${inputs.intent}"
first_action: "${inputs.first_action}"
hero: ${inputs.hero}
grounding_phrase: "${inputs.phrase}"

CANDIDATE SCRIPT (candidate_id ${candidate.candidate_id}, temperature ${candidate.temperature}):
---
${candidate.script}
---

Score each rubric axis and identify the weakest. Output JSON only.`;
}

async function critiqueOne(
  client: Anthropic,
  candidate: Candidate,
  inputs: ValidatedInputs
): Promise<Critique> {
  if (!candidate.script) {
    const emptyScores = Object.fromEntries(
      AXIS_NAMES.map((n) => [n, 0])
    ) as unknown as RubricScores;
    return {
      candidate_id: candidate.candidate_id,
      scores: emptyScores,
      overall_score: 0,
      weakest_axis: AXIS_NAMES[0],
      critique_notes: 'candidate failed generation',
    };
  }

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: CRITIQUE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(candidate, inputs) }],
  });
  const firstBlock = response.content[0];
  const raw = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
  const parsed = JSON.parse(stripJsonFences(raw));

  const rawScores = parsed.scores ?? {};
  const scores = Object.fromEntries(
    AXIS_NAMES.map((name) => {
      const v = rawScores[name];
      const num = typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) : 5;
      return [name, clamp(Number.isFinite(num) ? num : 5, 1, 10)];
    })
  ) as unknown as RubricScores;

  const overall = computeOverall(scores);
  let weakest = (parsed.weakest_axis as keyof RubricScores) ?? findWeakest(scores);
  if (!AXIS_NAMES.includes(weakest)) weakest = findWeakest(scores);

  return {
    candidate_id: candidate.candidate_id,
    scores,
    overall_score: overall,
    weakest_axis: weakest,
    critique_notes: parsed.critique_notes ?? '',
  };
}

export async function critiqueCandidates(
  candidates: Candidate[],
  inputs: ValidatedInputs
): Promise<Critique[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const client = new Anthropic({ apiKey });
  const tasks = candidates.map((c) =>
    critiqueOne(client, c, inputs).catch((err) => {
      const emptyScores = Object.fromEntries(
        AXIS_NAMES.map((n) => [n, 0])
      ) as unknown as RubricScores;
      return {
        candidate_id: c.candidate_id,
        scores: emptyScores,
        overall_score: 0,
        weakest_axis: AXIS_NAMES[0],
        critique_notes: `critique failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    })
  );
  return Promise.all(tasks);
}
