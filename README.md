# Oath

an anti-feed morning alarm ritual. v1: audio-first. v2: video.

## live demo

**[web-ten-sand-37.vercel.app](https://web-ten-sand-37.vercel.app)** — try the v2 engine yourself, watch the 10-stage pipeline run in real-time, hear the morning test ritual, see the rubric scoring, compare v1 vs v2 audio.

the demo runs the same engine the ios app will. `pipeline/v2/` is the python source of truth; [`web/lib/oath-engine/`](web/lib/oath-engine/) is a 1:1 typescript port that powers the vercel serverless `/api/generate` SSE endpoint (streams real-time pipeline trace as each stage completes).

## the wedge

generic motivation videos are everywhere. the problem is that the infinite feed wins at the exact moment your willpower is lowest. you wake up, your thumb finds tiktok, the first hour is gone.

oath steals that moment. you set your intent the night before. the alarm fires. you dismiss. a 45-90 second personalized ritual plays full screen, no scrolling possible. one button at the end. you start the hardest thing.

## status

monday, may 19 2026. spec review with oliver wednesday 3pm.

- [daily log](daily/)
- [v1 spec](docs/01-spec.md) — coming tuesday
- [v2 roadmap](docs/02-v2-roadmap.md) — coming tuesday
- [engine deep dive](docs/03-engine.md) — **v2 architecture, 10 stages, full diagram**
- [experiments](experiments/) — script generation done monday night, morning test running tuesday 6am
- [pipeline code](pipeline/) — v1 working end-to-end; [v2 pipeline](pipeline/v2/) ships the multi-pass engine

## the engine

[v2 pipeline architecture](docs/03-engine.md) — 10 stages, 8 claude calls, validated critique-refine-judge cycle. one orchestrator, one CLI, mode-tuned voice settings, prosody markup.

[see it in action](experiments/04-multi-pass-refinement/) — full per-stage trace from one real generation. every claude call's input and output is captured as a separate json file.

[v1 vs v2 comparison](experiments/05-v2-vs-v1-comparison/) — same inputs, two pipelines, audible difference. honest verdict: v2 doesn't beat v1 on a single happy run, but v2 bounds the worst case and gives full traceability.

## listen

3 generated rituals from monday night, all using "the_closer" voice (elevenlabs flash v2.5). these are the scripts going into tomorrow's 6am morning test.

- [hardest work, default](experiments/02-voice-synthesis/samples/morning_test__hardest_work__default.mp3)
- [gym now, default](experiments/02-voice-synthesis/samples/morning_test__gym_now__default.mp3)
- [grounding phrases, grounding_heavy](experiments/02-voice-synthesis/samples/morning_test__grounding_phrases__grounding_heavy.mp3)

read the scripts in [experiments/01-script-generation/outputs/](experiments/01-script-generation/outputs/) and the picks rationale in [experiments/01-script-generation/verdict.md](experiments/01-script-generation/verdict.md).

## try it

```bash
git clone https://github.com/Kartikkapoor8/oath
cd oath
pip install -r pipeline/requirements.txt
cp .env.local.example .env.local  # add your ANTHROPIC_API_KEY and ELEVENLABS_API_KEY
python pipeline/run.py \
    --mode hardest_work \
    --intent "your hardest task" \
    --first-action "what you'll do in the first 5 minutes" \
    --hero "your hero" \
    --phrase "your grounding phrase"
```

produces a 45-90 second mp3 ritual in under 30 seconds. modes: `hardest_work`, `gym_now`, `grounding_phrases`. variants: `default`, `more_clipped`, `more_narrative`, `hero_anchor_heavy`, `grounding_heavy`. voices: `the_closer`, `the_drill`, `the_stoic`, `the_coach`, `the_friend`. see [`pipeline/run.py --help`](pipeline/run.py) for all flags, and [a sample end-to-end run](experiments/03-end-to-end-runs/sample_run.mp3) for what comes out.

### or try the v2 multi-pass engine

```bash
python pipeline/v2/run_v2.py \
    --mode hardest_work \
    --intent "your hardest task" \
    --first-action "what you'll do in the first 5 minutes" \
    --hero "your hero" \
    --phrase "your grounding phrase" \
    --output ./ritual_v2.mp3
```

v2 runs 10 stages: input validation → claude pre-analysis → 3 candidate generations in parallel → 6-axis critique → winner selection → optional refinement → llm-as-judge → prosody markup → mode-tuned synthesis. produces an mp3 in ~25 seconds, writes a full `pipeline_run.json` trace alongside the audio. add `--save-stage-outputs DIR` to dump every claude call's input and output as separate json files.
