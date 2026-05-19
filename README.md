# Oath

an anti-feed morning alarm ritual. v1: audio-first. v2: video.

## live demo

**[web-ten-sand-37.vercel.app](https://web-ten-sand-37.vercel.app)** — hear the morning test ritual, try the engine with your own inputs, see the architecture, listen to all 5 voice archetypes.

the demo runs the same engine the ios app will. `pipeline/` is the python source of truth; [`web/lib/engine-bridge.ts`](web/lib/engine-bridge.ts) is a 1:1 typescript port for the vercel serverless functions.

## the wedge

generic motivation videos are everywhere. the problem is that the infinite feed wins at the exact moment your willpower is lowest. you wake up, your thumb finds tiktok, the first hour is gone.

oath steals that moment. you set your intent the night before. the alarm fires. you dismiss. a 45-90 second personalized ritual plays full screen, no scrolling possible. one button at the end. you start the hardest thing.

## status

monday, may 19 2026. spec review with oliver wednesday 3pm.

- [daily log](daily/)
- [v1 spec](docs/01-spec.md) — coming tuesday
- [v2 roadmap](docs/02-v2-roadmap.md) — coming tuesday
- [engine deep dive](docs/03-engine.md) — coming tuesday
- [experiments](experiments/) — script generation done monday night, morning test running tuesday 6am
- [pipeline code](pipeline/) — working end-to-end as of monday night

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
