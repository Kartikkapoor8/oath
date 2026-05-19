# oath — web demo

next.js 16 + tailwind v4 + framer motion. deployed to vercel. proves the OATH engine is real engineering work, not an api wrapper.

## what's here

- **staged demo** — plays the actual morning test ritual (the same mp3 kartik played at 6am tuesday)
- **try your own** — typed inputs hit `/api/generate-script` + `/api/synthesize-audio`, returns text + audio in 10-15s using the same engine logic as `pipeline/`
- **architecture diagram** — 8-stage visual of how the engine works
- **voice archetypes** — 5 preset samples, each playable + downloadable
- **roadmap** — v1.1 / v1.2 / v2 layers, clearly future-state
- **receipts** — links into the github repo (verdict.md, results.md, daily logs)

## local dev

```bash
cd web
npm install
cp .env.local.example .env.local  # add your real keys
npm run dev
```

open http://localhost:3000

## env vars

```
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
```

both required for the `try your own` section. without them the staged demo and voice preset samples still work (they're static files in `public/`).

## deploy

```bash
cd web
npx vercel --prod
```

set env vars in vercel dashboard before deploy completes.

## engine bridge

`lib/engine-bridge.ts` is a 1:1 port of the python pipeline:
- same 3-layer prompt composition (identity + mode + variant)
- same banned phrase list (20 entries)
- same word count validation (with mode-specific range for grounding)
- same retry-once-with-feedback logic
- same elevenlabs voice settings

single source of truth. when the python engine changes, the ts port should change in lockstep.

## why split api routes

two routes (`/api/generate-script` + `/api/synthesize-audio`) rather than one combined endpoint. reasoning:

1. **vercel hobby tier 10s function timeout** — combined would be 8-13s, too close to the limit. split keeps each under 10s.
2. **better ux** — user sees the generated script as soon as it's ready (5-8s), then the audio appears 3-5s later. two visible payoff moments instead of one long wait.
3. **easier failure modes** — if synthesis fails, the script is still visible. user can retry just the audio leg.
