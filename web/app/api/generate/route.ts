// streaming v2 pipeline endpoint.
//
// runs the full 10-stage pipeline server-side and emits sse events after each stage
// so the browser can show real-time pipeline trace UI. final event includes the
// audio data url + script + judge score.

import { runPipeline } from '@/lib/oath-engine/pipeline';
import type { StageEvent, PipelineInputs } from '@/lib/oath-engine/types';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro allows up to 300s; pipeline takes ~25s

export async function POST(req: Request) {
  let inputs: Record<string, unknown>;
  try {
    inputs = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller might be closed if client disconnected
        }
      };

      const start = Date.now();
      try {
        const result = await runPipeline(
          inputs as unknown as PipelineInputs,
          (evt: StageEvent) => send(evt)
        );

        // final aggregated event with the audio and script
        send({
          stage: 'final',
          script: result.final_script,
          marked_up_script: result.marked_up_script,
          audio_url: result.audio_url,
          final_score: result.final_score,
          get_out_of_bed: result.get_out_of_bed,
          judge_notes: result.judge_notes,
          refinement_triggered: result.refinement_triggered,
          total_elapsed_ms: result.total_elapsed_ms,
          total_claude_calls: result.total_claude_calls,
          total_elevenlabs_calls: result.total_elevenlabs_calls,
        });
      } catch (err) {
        send({
          stage: 'error',
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
          elapsed_ms: Date.now() - start,
        });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable proxy buffering so events stream live
    },
  });
}
