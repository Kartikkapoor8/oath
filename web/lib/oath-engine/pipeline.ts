// orchestrator for the typescript v2 pipeline.
//
// runs stages 0-8 (9 and 10 are browser-side for this port). emits StageEvent
// callbacks after each stage so the api route can stream sse updates to the browser.

import 'server-only';
import { validateAndNormalize } from './stage-0-validate';
import { analyzeAndPlan } from './stage-1-analyze';
import { generateCandidates } from './stage-2-generate';
import { critiqueCandidates } from './stage-3-critique';
import { selectWinner } from './stage-4-select';
import { refineScript } from './stage-5-refine';
import { judgeFinalScript } from './stage-6-judge';
import { addProsodyMarkup, countBreakTags } from './stage-7-prosody';
import { synthesize } from './stage-8-synthesize';
import type { PipelineInputs, StageEvent } from './types';

export interface PipelineResult {
  final_script: string;
  marked_up_script: string;
  audio_url: string;
  final_score: number;
  get_out_of_bed: boolean;
  judge_notes: string;
  refinement_triggered: boolean;
  total_elapsed_ms: number;
  total_claude_calls: number;
  total_elevenlabs_calls: number;
}

export async function runPipeline(
  inputs: PipelineInputs,
  onEvent: (e: StageEvent) => void,
  options: { n_candidates?: number } = {}
): Promise<PipelineResult> {
  const start = Date.now();
  const nCandidates = options.n_candidates ?? 3;
  let claudeCalls = 0;
  let elevenlabsCalls = 0;

  // stage 0
  let t = Date.now();
  onEvent({ stage: 'stage_0_validate', status: 'running' });
  const validated = validateAndNormalize(inputs);
  onEvent({
    stage: 'stage_0_validate',
    status: 'complete',
    elapsed_ms: Date.now() - t,
    output: { mode: validated.mode, variant: validated.variant, voice: validated.voice },
  });

  // stage 1
  t = Date.now();
  onEvent({ stage: 'stage_1_analyze', status: 'running' });
  const plan = await analyzeAndPlan(validated);
  claudeCalls += 1;
  onEvent({
    stage: 'stage_1_analyze',
    status: 'complete',
    elapsed_ms: Date.now() - t,
    output: {
      tone_notes: plan.tone_notes,
      hero_anchor_strategy: plan.hero_anchor_strategy,
      estimated_complexity: plan.estimated_complexity,
    },
  });

  // stage 2 (parallel)
  t = Date.now();
  onEvent({ stage: 'stage_2_generate', status: 'running', meta: { n_parallel: nCandidates } });
  const candidates = await generateCandidates(validated, plan, nCandidates);
  claudeCalls += nCandidates;
  onEvent({
    stage: 'stage_2_generate',
    status: 'complete',
    elapsed_ms: Date.now() - t,
    output: {
      n: candidates.length,
      temperatures: candidates.map((c) => c.temperature),
      word_counts: candidates.map((c) => c.word_count),
      self_checks: candidates.map((c) => c.internal_self_check),
    },
  });

  // stage 3 (parallel)
  t = Date.now();
  onEvent({ stage: 'stage_3_critique', status: 'running', meta: { n_parallel: nCandidates } });
  const critiques = await critiqueCandidates(candidates, validated);
  claudeCalls += nCandidates;
  onEvent({
    stage: 'stage_3_critique',
    status: 'complete',
    elapsed_ms: Date.now() - t,
    output: {
      overall_scores: critiques.map((c) => c.overall_score),
      weakest_axes: critiques.map((c) => c.weakest_axis),
      // include the winning candidate's full scores for the rubric viz on the client
      // we don't know the winner yet at this point, so include all critiques' scores
      all_scores: critiques.map((c) => ({ candidate_id: c.candidate_id, scores: c.scores })),
    },
  });

  // stage 4 (pure)
  t = Date.now();
  onEvent({ stage: 'stage_4_select', status: 'running' });
  const selection = selectWinner(candidates, critiques);
  onEvent({
    stage: 'stage_4_select',
    status: 'complete',
    elapsed_ms: Date.now() - t,
    output: {
      winner_id: selection.winner.candidate_id,
      passes_threshold: selection.passes_threshold,
      refinement_needed: selection.refinement_needed,
      winning_scores: selection.winner_critique.scores,
      winning_overall: selection.winner_critique.overall_score,
      winning_critique_notes: selection.winner_critique.critique_notes,
      selection_reason: selection.selection_reason,
    },
  });

  // stage 5 (conditional)
  let finalScript = selection.winner.script;
  let refinementTriggered = false;
  if (selection.refinement_needed) {
    t = Date.now();
    onEvent({ stage: 'stage_5_refine', status: 'running' });
    const refinement = await refineScript(selection.winner, selection.winner_critique, validated, plan);
    claudeCalls += 1;
    finalScript = refinement.refined_script;
    refinementTriggered = true;
    onEvent({
      stage: 'stage_5_refine',
      status: 'complete',
      elapsed_ms: Date.now() - t,
      output: { word_count: refinement.word_count, what_was_fixed: refinement.what_was_fixed },
    });
  } else {
    onEvent({ stage: 'stage_5_refine', status: 'skipped', meta: { reason: 'winner passed threshold' } });
  }

  // stage 6
  t = Date.now();
  onEvent({ stage: 'stage_6_judge', status: 'running' });
  const judgment = await judgeFinalScript(finalScript, validated);
  claudeCalls += 1;
  onEvent({
    stage: 'stage_6_judge',
    status: 'complete',
    elapsed_ms: Date.now() - t,
    output: {
      final_quality_score: judgment.final_quality_score,
      would_get_user_out_of_bed: judgment.would_get_user_out_of_bed,
      judge_notes: judgment.judge_notes,
    },
  });

  // stage 7 (pure)
  t = Date.now();
  onEvent({ stage: 'stage_7_prosody', status: 'running' });
  const markedUp = addProsodyMarkup(finalScript, validated.mode, validated.phrase);
  const breakCount = countBreakTags(markedUp);
  onEvent({
    stage: 'stage_7_prosody',
    status: 'complete',
    elapsed_ms: Date.now() - t,
    output: { break_count: breakCount, mode_tuning_applied: validated.mode },
  });

  // stage 8
  t = Date.now();
  onEvent({ stage: 'stage_8_synthesize', status: 'running' });
  const synth = await synthesize(markedUp, validated.voice, validated.mode);
  elevenlabsCalls += 1;
  onEvent({
    stage: 'stage_8_synthesize',
    status: 'complete',
    elapsed_ms: Date.now() - t,
    output: {
      voice_preset: synth.voice_preset,
      voice_label: synth.voice_label,
      voice_settings_used: synth.voice_settings_used,
      audio_bytes: synth.audio_bytes,
      estimated_duration_seconds: synth.estimated_duration_seconds,
    },
  });

  // stage 9 (stub)
  onEvent({
    stage: 'stage_9_music_bed',
    status: 'skipped',
    meta: { reason: 'v1.1 stub — music bed mixing deferred pending pre-licensed bed library' },
  });

  // stage 10 — final assembly is browser-side via the SSE 'final' event
  onEvent({ stage: 'stage_10_assemble', status: 'complete', elapsed_ms: 0 });

  const totalMs = Date.now() - start;

  return {
    final_script: finalScript,
    marked_up_script: markedUp,
    audio_url: synth.audio_base64,
    final_score: judgment.final_quality_score,
    get_out_of_bed: judgment.would_get_user_out_of_bed,
    judge_notes: judgment.judge_notes,
    refinement_triggered: refinementTriggered,
    total_elapsed_ms: totalMs,
    total_claude_calls: claudeCalls,
    total_elevenlabs_calls: elevenlabsCalls,
  };
}
