// hard-coded view of experiments/04-multi-pass-refinement/final_run.json so the
// StagedDemo's TraceExplorer renders instantly without a server fetch. these values
// are mirrored from the real run on monday-night with kartik's morning test inputs.
//
// when the pipeline runs again on different inputs, the trace UI will show real-time
// data instead — this file is purely the pre-staged view.

export const STAGED_TRACE = {
  timestamp: '2026-05-20T00:37:04Z',
  inputs: {
    mode: 'hardest_work',
    intent: 'ship the OATH v1 spec to github and send Oliver the link before noon',
    first_action: 'open the spec doc and write the wedge section',
    hero: 'Kobe Bryant',
    phrase: 'trust the work',
    variant: 'default',
    voice: 'the_closer',
  },
  total_elapsed_seconds: 25.11,
  total_claude_calls: 8,
  total_elevenlabs_calls: 1,
  final_judge_score: 8.7,
  get_out_of_bed: true,
  refinement_triggered: false,
  winning_candidate_id: 3,
  winning_temperature: 1.0,
  winning_overall: 9.41,
  candidate_summary: [
    { id: 1, temperature: 0.6, word_count: 124, internal_self_check: 9, overall_score: 8.71, weakest_axis: 'hero_anchor_concreteness' },
    { id: 2, temperature: 0.8, word_count: 144, internal_self_check: 9, overall_score: 8.41, weakest_axis: 'cliche_freedom' },
    { id: 3, temperature: 1.0, word_count: 141, internal_self_check: 9, overall_score: 9.41, weakest_axis: 'cliche_freedom' },
  ],
  // the winning candidate's rubric scores — used by RubricVisualization radar chart
  winning_scores: {
    specificity: 10,
    command_density: 9,
    structural_arc_completeness: 10,
    cliche_freedom: 8,
    hero_anchor_concreteness: 9,
    voice_directness: 10,
  },
  winning_critique_notes:
    "'The rest of the day was built on that hour' edges into motivational-poster territory, and 'One section becomes the whole' has a faint aphoristic softness that feels slightly borrowed rather than earned. To fix, replace these with more concrete mechanical language that mirrors the spec-shipping context.",
  judge_notes:
    "The 'debt coming due' framing hits hard and the Kobe analogy is specific enough to feel earned rather than generic — isolating one weakness before anyone else laces up maps cleanly onto 'write the wedge section.' The closing sequence is a tight action chain that leaves no ambiguity about what to do next.",
  final_script: `It is 5am.
The room is dark.
Nothing has moved yet.

Last night you said you would ship the OATH v1 spec to GitHub
and send Oliver the link before noon.
Not eventually. Before noon.
That is not a goal.
That is a debt coming due.

Kobe targeted his weaknesses in an empty Staples Center at 4am.
Not the full game. One thing.
Left hand. Mid-range. Footwork off the catch.
One thing, isolated, destroyed, before anyone else laced up.
The rest of the day was built on that hour.

This is the same hour.

Trust the work.

Sixty minutes. Phone face down.
Open the spec doc.
Write the wedge section.
One section becomes the whole.
The whole becomes the link.
The link lands in Oliver's inbox before noon.

Nothing else exists until the wedge section is done.

Open it.`,
  per_stage_elapsed_ms: {
    stage_0_validate: 0,
    stage_1_analyze: 8100,
    stage_2_generate: 5652,
    stage_3_critique: 5901,
    stage_4_select: 0,
    stage_5_refine: null,
    stage_6_judge: 3113,
    stage_7_prosody: 0,
    stage_8_synthesize: 2344,
    stage_9_music_bed: 0,
    stage_10_assemble: 0,
  },
  prosody_break_count: 7,
  github_trace_url: 'https://github.com/Kartikkapoor8/oath/blob/main/experiments/04-multi-pass-refinement/final_run.json',
  github_stage_outputs_url: 'https://github.com/Kartikkapoor8/oath/tree/main/experiments/04-multi-pass-refinement/stage_outputs',
};

export const RUBRIC_META: Array<{
  key: keyof typeof STAGED_TRACE.winning_scores;
  label: string;
  weight: number;
  what: string;
}> = [
  { key: 'specificity', label: 'specificity', weight: 2.0, what: "does the script reference the user's exact intent?" },
  { key: 'command_density', label: 'command density', weight: 1.5, what: 'imperative verbs vs descriptive sentences' },
  { key: 'structural_arc_completeness', label: 'structural arc', weight: 1.5, what: 'all 5 beats present in order' },
  { key: 'cliche_freedom', label: 'cliché freedom', weight: 1.0, what: 'absence of subtle motivational clichés' },
  { key: 'hero_anchor_concreteness', label: 'hero concreteness', weight: 1.5, what: 'specific habit vs vague platitude' },
  { key: 'voice_directness', label: 'voice directness', weight: 1.0, what: 'statements vs questions, no hedges' },
];

export const PIPELINE_STAGES: Array<{
  id: string;
  number: string;
  name: string;
  description: string;
  tags: Array<{ label: string; tone: 'claude' | 'parallel' | 'logic' | 'elevenlabs' | 'stub' | 'conditional' }>;
  fanOut?: number;
}> = [
  {
    id: 'stage_0_validate',
    number: '00',
    name: 'Validate',
    description: "normalize and validate user inputs against length limits + enum sets",
    tags: [{ label: 'pure logic', tone: 'logic' }],
  },
  {
    id: 'stage_1_analyze',
    number: '01',
    name: 'Analyze & Plan',
    description: 'claude produces a structural plan before any script is written',
    tags: [{ label: 'claude call', tone: 'claude' }],
  },
  {
    id: 'stage_2_generate',
    number: '02',
    name: 'Generate Candidates',
    description: '3 candidate scripts in parallel at temperatures 0.6, 0.8, 1.0',
    tags: [
      { label: 'claude × 3', tone: 'claude' },
      { label: 'parallel', tone: 'parallel' },
    ],
    fanOut: 3,
  },
  {
    id: 'stage_3_critique',
    number: '03',
    name: 'Critique',
    description: 'each candidate scored against 6-axis rubric in parallel',
    tags: [
      { label: 'claude × 3', tone: 'claude' },
      { label: 'parallel', tone: 'parallel' },
    ],
    fanOut: 3,
  },
  {
    id: 'stage_4_select',
    number: '04',
    name: 'Select Winner',
    description: 'pure logic: highest passing score, refinement decision',
    tags: [{ label: 'pure logic', tone: 'logic' }],
  },
  {
    id: 'stage_5_refine',
    number: '05',
    name: 'Refine',
    description: 'if below threshold, regenerate with critique injected as feedback',
    tags: [{ label: 'claude call', tone: 'claude' }, { label: 'conditional', tone: 'conditional' }],
  },
  {
    id: 'stage_6_judge',
    number: '06',
    name: 'Judge',
    description: 'holistic 1-10 quality score + binary get-out-of-bed verdict',
    tags: [{ label: 'claude call', tone: 'claude' }],
  },
  {
    id: 'stage_7_prosody',
    number: '07',
    name: 'Prosody Markup',
    description: 'mode-tuned <break /> tags inserted between beats',
    tags: [{ label: 'pure logic', tone: 'logic' }],
  },
  {
    id: 'stage_8_synthesize',
    number: '08',
    name: 'Synthesize',
    description: 'elevenlabs flash v2.5 with per-mode voice settings',
    tags: [{ label: 'elevenlabs', tone: 'elevenlabs' }],
  },
  {
    id: 'stage_9_music_bed',
    number: '09',
    name: 'Music Bed Mixing',
    description: 'pre-licensed instrumental bed mixed under voice (v1.1)',
    tags: [{ label: 'v1.1 stub', tone: 'stub' }],
  },
  {
    id: 'stage_10_assemble',
    number: '10',
    name: 'Assemble',
    description: 'final mp3 + complete pipeline_run.json with full trace',
    tags: [{ label: 'pure logic', tone: 'logic' }],
  },
];
