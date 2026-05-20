# multi-pass refinement experiment

shows OATH's v2 pipeline in action on kartik's actual morning test inputs.

## what this proves

the v2 pipeline runs 10 distinct stages with 8 separate claude calls and a critique-select-refine-judge cycle. each stage's input and output is captured here as evidence the engine is genuinely multi-pass, not a single API call.

## the inputs

| field | value |
|---|---|
| mode | hardest_work |
| intent | ship the OATH v1 spec to github and send Oliver the link before noon |
| first action | open the spec doc and write the wedge section |
| hero | Kobe Bryant |
| phrase | trust the work |
| variant | default |
| voice | the_closer |

## the result

| metric | value |
|---|---|
| total elapsed | 25.11s |
| claude calls | 8 (1 analyze + 3 candidates + 3 critiques + 1 judge) |
| elevenlabs calls | 1 |
| refinement triggered | no (winner passed threshold at 9.41/10) |
| final quality score | 8.7/10 |
| would_get_user_out_of_bed | yes |
| final audio | [final_audio.mp3](final_audio.mp3) (66s, 1.08 MB) |
| consolidated trace | [final_run.json](final_run.json) |

## the stages

each `stage_outputs/stage_N_*.json` is the full input and output for one stage. read them in order to see the pipeline flow:

1. [stage_0_validation.json](stage_outputs/stage_0_validation.json) — normalize the inputs
2. [stage_1_analysis.json](stage_outputs/stage_1_analysis.json) — claude plans the script structurally
3. [stage_2_candidates.json](stage_outputs/stage_2_candidates.json) — 3 candidates in parallel at temps 0.6, 0.8, 1.0
4. [stage_3_critiques.json](stage_outputs/stage_3_critiques.json) — each candidate scored on 6-axis rubric
5. [stage_4_selection.json](stage_outputs/stage_4_selection.json) — winner picked by weighted overall score
6. [stage_5_refinement.json](stage_outputs/stage_5_refinement.json) — refine if winner < threshold (null this run, winner passed)
7. [stage_6_judge.json](stage_outputs/stage_6_judge.json) — holistic 1-10 quality score + binary verdict
8. [stage_7_prosody.json](stage_outputs/stage_7_prosody.json) — `<break time="..." />` tags added for mode-tuned pacing
9. [stage_8_synthesis.json](stage_outputs/stage_8_synthesis.json) — elevenlabs flash with hardest_work-mode voice settings
10. [stage_9_music_bed.json](stage_outputs/stage_9_music_bed.json) — v1.1 stub (pass-through)

## what the rubric showed this run

| candidate | temp | overall | weakest axis | weakest score |
|---|---|---|---|---|
| 1 | 0.6 | 8.71/10 | hero_anchor_concreteness | 8/10 |
| 2 | 0.8 | 8.41/10 | cliche_freedom | 7/10 |
| 3 | 1.0 | **9.41/10** | cliche_freedom | 8/10 |

candidate 3 (highest temperature) won. counter-intuitive at first glance — but the higher-temp candidate produced the more specific kobe anchor ("Staples Center at 4am... left hand. mid-range. footwork off the catch.") which scored higher on specificity (10/10) and hero_anchor_concreteness (9/10) than the lower-temp variants. **the lesson: the multi-candidate stage with temperature variance is doing real selection work, not just averaging.**

## comparison with v1

see [experiments/05-v2-vs-v1-comparison/](../05-v2-vs-v1-comparison/) for the same inputs run through both pipelines side by side.
