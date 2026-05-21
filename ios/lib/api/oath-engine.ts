import Constants from 'expo-constants';

// Types mirrored from web/lib/oath-engine/types.ts. If the server-side
// types change, this file must be updated to match.

export type Mode = 'hardest_work' | 'gym_now' | 'grounding_phrases';

export type Variant =
  | 'default'
  | 'more_clipped'
  | 'more_narrative'
  | 'hero_anchor_heavy'
  | 'grounding_heavy';

export type VoicePreset =
  | 'the_closer'
  | 'the_drill'
  | 'the_stoic'
  | 'the_coach'
  | 'the_friend';

export interface PipelineInputs {
  mode: Mode;
  intent: string;
  first_action: string;
  hero: string;
  phrase: string;
  variant?: Variant;
  voice?: VoicePreset;
  target_duration_seconds?: number;
}

export type StageId =
  | 'stage_0_validate'
  | 'stage_1_analyze'
  | 'stage_2_generate'
  | 'stage_3_critique'
  | 'stage_4_select'
  | 'stage_5_refine'
  | 'stage_6_judge'
  | 'stage_7_prosody'
  | 'stage_8_synthesize'
  | 'stage_9_music_bed'
  | 'stage_10_assemble'
  | 'final'
  | 'error';

export type StageStatus = 'running' | 'complete' | 'skipped' | 'error';

export interface StageEvent {
  stage: StageId;
  status: StageStatus;
  elapsed_ms?: number;
  output?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  error?: string;
}

export interface FinalEvent {
  stage: 'final';
  script: string;
  marked_up_script?: string;
  audio_url: string;
  final_score: number;
  get_out_of_bed: boolean;
  judge_notes?: string;
  refinement_triggered?: boolean;
  total_elapsed_ms: number;
  total_claude_calls: number;
  total_elevenlabs_calls: number;
}

export type PipelineEvent = StageEvent | FinalEvent;

function getApiBase(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiBase as string | undefined;
  return fromExtra || 'https://web-ten-sand-37.vercel.app';
}

export class PipelineError extends Error {
  constructor(message: string, public readonly stage?: StageId) {
    super(message);
    this.name = 'PipelineError';
  }
}

/**
 * Streams pipeline events from the v2 engine over SSE. Yields each stage
 * event as it arrives; returns the FinalEvent when the pipeline completes.
 * Throws PipelineError on transport failure or server-reported error.
 */
export async function* generateRitual(
  input: PipelineInputs,
  signal?: AbortSignal,
): AsyncGenerator<StageEvent, FinalEvent | null, void> {
  const response = await fetch(`${getApiBase()}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok) {
    throw new PipelineError(
      `Pipeline HTTP ${response.status}: ${response.statusText}`,
    );
  }
  if (!response.body) {
    throw new PipelineError('Pipeline returned no response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: FinalEvent | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json) continue;

      let payload: PipelineEvent;
      try {
        payload = JSON.parse(json) as PipelineEvent;
      } catch (err) {
        console.warn('failed to parse SSE event', json, err);
        continue;
      }

      if (payload.stage === 'final') {
        finalResult = payload as FinalEvent;
        continue;
      }
      if (payload.stage === 'error') {
        const evt = payload as StageEvent;
        throw new PipelineError(evt.error || 'pipeline error', evt.stage);
      }

      yield payload as StageEvent;
    }
  }

  return finalResult;
}
