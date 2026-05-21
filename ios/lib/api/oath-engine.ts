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

export const PIPELINE_TIMEOUT_MS = 60_000;

const DEBUG = false; // flip to true to log every step of generation

function log(...args: unknown[]) {
  if (DEBUG) console.log('[oath-engine]', ...args);
}

function parseSseBody(text: string): PipelineEvent[] {
  const events: PipelineEvent[] = [];
  for (const block of text.split('\n\n')) {
    const line = block.trim();
    if (!line.startsWith('data: ')) continue;
    const json = line.slice(6).trim();
    if (!json) continue;
    try {
      events.push(JSON.parse(json) as PipelineEvent);
    } catch (err) {
      log('failed to parse SSE event', json, err);
    }
  }
  return events;
}

/**
 * Runs the pipeline against the live engine and yields events.
 *
 * React Native's `fetch` does not expose `response.body` as a streaming
 * `ReadableStream`. The earlier streaming implementation worked under
 * curl and on Expo Web but threw "pipeline returned no response body" on
 * the iOS Expo Go runtime. We now read the full response text and parse
 * the SSE events from it; the consumer (`/onboarding/generating`) drives
 * progressive UI with a wall-clock fake timer.
 *
 * Default timeout: 60s — the engine usually completes in ~27s but we
 * leave headroom for slow networks (real users on cellular).
 *
 * Errors marked `retryable: true` are safe to retry once (network /
 * 5xx). `retryable: false` errors are server-reported stage failures
 * that will fail the same way on retry.
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
    else
      options.signal.addEventListener('abort', () =>
        controller.abort(options.signal!.reason),
      );
  }

  const url = `${getApiBase()}/api/generate`;
  log('fetch ->', url);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
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

    log('response status', response.status);

    if (!response.ok) {
      const retryable = response.status >= 500;
      throw new PipelineError(
        `pipeline HTTP ${response.status}`,
        undefined,
        retryable,
      );
    }

    let text: string;
    try {
      text = await response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new PipelineError(`read body: ${msg}`, undefined, true);
    }

    log('body length', text.length);

    const events = parseSseBody(text);
    log('parsed events', events.length);

    if (events.length === 0) {
      throw new PipelineError('pipeline returned no events', undefined, true);
    }

    let finalResult: FinalEvent | null = null;
    for (const payload of events) {
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

    if (!finalResult) {
      throw new PipelineError(
        'pipeline finished without a final event',
        undefined,
        true,
      );
    }

    log('done — final_score', finalResult.final_score);
    return finalResult;
  } finally {
    clearTimeout(timeoutId);
  }
}
