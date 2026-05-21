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
  constructor(
    message: string,
    public readonly stage?: StageId,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}

export const PIPELINE_TIMEOUT_MS = 35_000;

/**
 * Streams pipeline events from the v2 engine over SSE. Yields each stage
 * event as it arrives; returns the FinalEvent when the pipeline completes.
 *
 * Default timeout is 35s — slightly above the engine's own 30s ceiling.
 * Pass a longer `timeoutMs` for slow networks. Pass an external `signal`
 * to abort from the caller (e.g., when the user navigates away mid-stream).
 *
 * Throws PipelineError on transport failure or server-reported stage error.
 * Errors marked `retryable: true` are safe to retry once (network failures);
 * `retryable: false` errors are validation / server-side issues that will
 * fail the same way on retry.
 */
export async function* generateRitual(
  input: PipelineInputs,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): AsyncGenerator<StageEvent, FinalEvent | null, void> {
  const timeoutMs = options.timeoutMs ?? PIPELINE_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(new Error('pipeline timeout')),
    timeoutMs,
  );
  if (options.signal) {
    if (options.signal.aborted) controller.abort(options.signal.reason);
    else options.signal.addEventListener('abort', () => controller.abort(options.signal!.reason));
  }

  try {
    let response: Response;
    try {
      response = await fetch(`${getApiBase()}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new PipelineError(`network: ${msg}`, undefined, true);
    }

    if (!response.ok) {
      const retryable = response.status >= 500;
      throw new PipelineError(
        `pipeline HTTP ${response.status}`,
        undefined,
        retryable,
      );
    }
    if (!response.body) {
      throw new PipelineError('pipeline returned no response body', undefined, true);
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
          throw new PipelineError(
            evt.error || 'pipeline error',
            evt.stage,
            false,
          );
        }

        yield payload as StageEvent;
      }
    }

    return finalResult;
  } finally {
    clearTimeout(timeoutId);
  }
}
