// shared types for the v2 typescript port

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

export interface ValidatedInputs {
  mode: Mode;
  intent: string;
  first_action: string;
  hero: string;
  phrase: string;
  variant: Variant;
  voice: VoicePreset;
  target_duration_seconds: number;
}

export interface AnalysisPlan {
  tone_notes: string;
  hero_anchor_strategy: string;
  grounding_phrase_placement: string;
  command_structure: string;
  estimated_complexity: 'low' | 'medium' | 'high';
}

export interface Candidate {
  candidate_id: number;
  script: string;
  word_count: number;
  estimated_duration_seconds: number;
  internal_self_check: number | null;
  temperature: number;
  violations: string[];
}

export interface RubricScores {
  specificity: number;
  command_density: number;
  structural_arc_completeness: number;
  cliche_freedom: number;
  hero_anchor_concreteness: number;
  voice_directness: number;
}

export interface Critique {
  candidate_id: number;
  scores: RubricScores;
  overall_score: number;
  weakest_axis: keyof RubricScores;
  critique_notes: string;
}

export interface SelectionResult {
  winner: Candidate;
  winner_critique: Critique;
  passes_threshold: boolean;
  refinement_needed: boolean;
  selection_reason: string;
}

export interface Refinement {
  refined_script: string;
  word_count: number;
  what_was_fixed: string;
}

export interface Judgment {
  final_quality_score: number;
  would_get_user_out_of_bed: boolean;
  judge_notes: string;
}

export interface SynthesisResult {
  audio_base64: string; // data URL
  audio_bytes: number;
  voice_preset: VoicePreset;
  voice_id: string;
  voice_label: string;
  estimated_duration_seconds: number;
  voice_settings_used: import('./voice-settings').VoiceSettings;
}

// SSE event types — wire format between server and browser
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
  audio_url: string; // data URL
  final_score: number;
  get_out_of_bed: boolean;
  total_elapsed_ms: number;
  total_claude_calls: number;
  total_elevenlabs_calls: number;
}
