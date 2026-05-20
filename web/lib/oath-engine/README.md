# oath-engine — typescript port of the v2 pipeline

mirror of `pipeline/v2/` (python). same prompts, same rubric, same logic, same voice settings. drives the live engine demo in the vercel page's "try your own" section.

## why a port (not a proxy)

vercel-only deployment, no separate python service to manage. cold starts are faster. the python pipeline stays the source of truth for the ios app's backend; this port is for the browser demo.

## keep in sync with python

every prompt and constant is mirrored as json:
- [`prompts.json`](./prompts.json) ↔ [`pipeline/v2/prompts.py`](../../../pipeline/v2/prompts.py)
- [`rubric.json`](./rubric.json) ↔ [`pipeline/v2/rubric.py`](../../../pipeline/v2/rubric.py)
- [`few-shot-examples.json`](./few-shot-examples.json) ↔ [`pipeline/v2/few_shot_examples.py`](../../../pipeline/v2/few_shot_examples.py)
- [`voice-settings.ts`](./voice-settings.ts) ↔ [`pipeline/v2/voice_settings.py`](../../../pipeline/v2/voice_settings.py)

if you change any prompt in python, update the json here too. if you change the rubric weights in python, update `rubric.json`. drift between python and typescript = drift between ios app and web demo.

## stages

| file | python equivalent |
|---|---|
| `stage-0-validate.ts` | `stage_0_validate.py` |
| `stage-1-analyze.ts` | `stage_1_analyze.py` |
| `stage-2-generate.ts` | `stage_2_generate.py` |
| `stage-3-critique.ts` | `stage_3_critique.py` |
| `stage-4-select.ts` | `stage_4_select.py` |
| `stage-5-refine.ts` | `stage_5_refine.py` |
| `stage-6-judge.ts` | `stage_6_judge.py` |
| `stage-7-prosody.ts` | `stage_7_prosody.py` |
| `stage-8-synthesize.ts` | `stage_8_synthesize.py` |
| `pipeline.ts` | `pipeline.py` |

stage 9 (music bed) is a v1.1 stub in both. stage 10 (assemble) is browser-side rendering in this port, not a backend stage.

## emits sse events

the orchestrator in `pipeline.ts` accepts an `onEvent` callback that fires after each stage completes. the api route at `app/api/generate/route.ts` wires this to a server-sent events stream so the browser sees real-time pipeline progress.
