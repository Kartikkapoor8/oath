// stage 4: pure-logic winner selection. mirrors pipeline/v2/stage_4_select.py

import 'server-only';
import rubricJson from './rubric.json';
import type { Candidate, Critique, SelectionResult, RubricScores } from './types';

const THRESHOLDS = rubricJson.thresholds;
const AXIS_NAMES = Object.keys(rubricJson.axes) as Array<keyof RubricScores>;

function passesThreshold(scores: RubricScores, overall: number): boolean {
  if (overall < THRESHOLDS.minimum_overall_score) return false;
  for (const name of AXIS_NAMES) {
    if ((scores[name] ?? 0) < THRESHOLDS.minimum_axis_score) return false;
  }
  return true;
}

export function selectWinner(candidates: Candidate[], critiques: Critique[]): SelectionResult {
  if (!candidates.length || candidates.length !== critiques.length) {
    throw new Error('candidates and critiques must be non-empty and same length');
  }

  const pairs = candidates.map((c, i) => ({ candidate: c, critique: critiques[i] }));
  const passing = pairs.filter((p) => passesThreshold(p.critique.scores, p.critique.overall_score));

  if (passing.length > 0) {
    const winnerPair = passing.reduce((best, cur) =>
      cur.critique.overall_score > best.critique.overall_score ? cur : best
    );
    return {
      winner: winnerPair.candidate,
      winner_critique: winnerPair.critique,
      passes_threshold: true,
      refinement_needed: false,
      selection_reason: `candidate ${winnerPair.candidate.candidate_id} passed thresholds with overall ${winnerPair.critique.overall_score}/10 (best of ${passing.length} passing)`,
    };
  }

  const winnerPair = pairs.reduce((best, cur) =>
    cur.critique.overall_score > best.critique.overall_score ? cur : best
  );
  return {
    winner: winnerPair.candidate,
    winner_critique: winnerPair.critique,
    passes_threshold: false,
    refinement_needed: true,
    selection_reason: `no candidate passed thresholds. picked candidate ${winnerPair.candidate.candidate_id} as closest-to-passing (overall ${winnerPair.critique.overall_score}/10, weakest axis: ${winnerPair.critique.weakest_axis})`,
  };
}
