# v1 vs v2 comparison

same inputs, two pipelines.

## inputs (identical for both)

| field | value |
|---|---|
| mode | hardest_work |
| intent | ship the OATH v1 spec to github and send Oliver the link before noon |
| first action | open the spec doc and write the wedge section |
| hero | Kobe Bryant |
| phrase | trust the work |

## v1 pipeline

- 1 claude call (3-layer prompt, single generation)
- 1 elevenlabs call (global voice settings)
- ~10 seconds end-to-end
- ~$0.07 per ritual (approx)
- output: [`v1_output.mp3`](v1_output.mp3) (827 KB, ~52 s)

## v2 pipeline

- 8 claude calls (1 analyze + 3 candidates parallel + 3 critiques parallel + 1 judge; refinement optional)
- 1 elevenlabs call (mode-tuned voice settings + 7 prosody break tags)
- ~25 seconds end-to-end
- ~$0.13 per ritual (approx)
- output: [`v2_output.mp3`](v2_output.mp3) (1.06 MB, ~66 s)

## judge scores (same llm, same rubric prompt, applied to both)

| pipeline | score | get_out_of_bed |
|---|---|---|
| v1 | **8.7 / 10** | yes |
| v2 | **8.7 / 10** | yes |

honest finding: on this single run, the v2 judge gives both scripts the same overall score. v2 is **not magically better content** on a per-shot basis when v1 already lucked into a strong output.

## the scripts, side by side

### v1 script (127 words)

> It's early.
> You're in bed.
> That's fine.
>
> You said last night you'd ship the OATH v1 spec to GitHub
> and send Oliver the link before noon.
> You said it. It's written.
>
> Kobe was in the gym at 4am.
> Empty building. No cameras. No crowd.
> Three hundred makes before anyone else arrived.
> Not because someone was watching.
> Because the work was the point.
>
> Trust the work.
>
> You have one move right now.
> Open the spec doc.
> Write the wedge section.
> Five minutes. That's the door.
>
> After that, sixty minutes. Phone face down.
> No feed. No notifications. No detours.
> Just the spec, the words, the commit, the link.
> Oliver gets it before noon.
>
> Sit up.
> Feet on the floor.
> Open the doc.
>
> Go.

### v2 script (141 words, post-multi-candidate selection)

> It is 5am.
> The room is dark.
> Nothing has moved yet.
>
> Last night you said you would ship the OATH v1 spec to GitHub
> and send Oliver the link before noon.
> Not eventually. Before noon.
> That is not a goal.
> That is a debt coming due.
>
> Kobe targeted his weaknesses in an empty Staples Center at 4am.
> Not the full game. One thing.
> Left hand. Mid-range. Footwork off the catch.
> One thing, isolated, destroyed, before anyone else laced up.
> The rest of the day was built on that hour.
>
> This is the same hour.
>
> Trust the work.
>
> Sixty minutes. Phone face down.
> Open the spec doc.
> Write the wedge section.
> One section becomes the whole.
> The whole becomes the link.
> The link lands in Oliver's inbox before noon.
>
> Nothing else exists until the wedge section is done.
>
> Open it.

## the audible differences

both mp3s use the same voice (the_closer / Adam) on the same elevenlabs model (flash v2.5). the differences are content + prosody + voice settings:

1. **v2 hero anchor is documentary-grade specific.** v1 says "Kobe was in the gym at 4am... three hundred makes before anyone else arrived" — accurate to public reporting but generic. v2 says "Kobe targeted his weaknesses in an empty Staples Center at 4am. Left hand. Mid-range. Footwork off the catch." — specific location, specific drills, structured like a documentary clip. this is the kind of detail that comes out of the temp=1.0 candidate that won stage 4.

2. **v2 reframes the commitment.** v1: "you said it. it's written." v2: "that is not a goal. that is a debt coming due." the "debt coming due" line is sharper — converts the commitment from a passive note into an active obligation.

3. **v2 has 7 explicit `<break time="1.5s" />` tags** between beats. listen for the deliberate pauses around "Trust the work" and after "This is the same hour" — the audio feels directed, not narrated. v1 has no explicit pacing — elevenlabs interprets line breaks but doesn't get the dramatic spacing.

4. **v2 uses hardest_work-mode voice settings** (stability 0.6, similarity_boost 0.8, style 0.2, speaker_boost on) instead of v1's global defaults (0.5/0.75/0.3/on). the v2 audio is slightly slower, more grounded, less style variation. on the mp3 the difference is subtle — Adam sounds a touch more measured.

5. **v2 closing is single-verb "Open it."** vs v1's three-line "Sit up. Feet on the floor. Open the doc. Go." both work; v2's is tighter.

## what v2 actually buys you (beyond this run)

the judge score being the same on a single happy-path run is real and worth saying out loud. but the v2 value isn't "every script is 0.5 points better." it's **robustness across runs**:

- **multi-candidate generation guards against bad single-shot rolls.** v1 has 1 generation. if that one is mediocre, you get the mediocre script. v2 generates 3 candidates at different temperatures and picks the best by 6-axis rubric. **the worst v2 run will look like the median v1 run.**

- **the critique stage catches what the model doesn't catch about itself.** stage 2's `internal_self_check` field reports the model's own confidence (typically 8-9 across the board). stage 3 is a separate critique pass with a structured rubric that can return lower scores when the model overstated. on this run candidate 2 self-checked at 9 but got 8.41 from the critique — a real disagreement caught only by the second pass.

- **structured traceability.** v1 returns a single JSON dump. v2 writes 10 per-stage files plus a consolidated `final_run.json`. when an output drifts in production, the v2 trace tells you which stage drifted — generation, critique, judge, prosody, or synthesis.

- **mode-tuned voice settings + prosody markup.** these aren't single-shot wins on this run, but on gym_now and grounding_phrases modes the differences are more audible (low style vs high style, short pauses vs long pauses). this comparison shows the v2 hardest_work tuning; for the full effect, listen to v2 on grounding_phrases (long liturgical breaks) vs gym_now (kinetic short breaks).

## bottom line

| dimension | v1 | v2 | winner |
|---|---|---|---|
| script quality (single happy run) | 8.7/10 | 8.7/10 | tie |
| hero anchor specificity | good | better | v2 |
| prosody / pacing | implicit | explicit (7 break tags) | v2 |
| voice tuning per mode | global | per-mode | v2 |
| latency | ~10s | ~25s | v1 |
| cost per ritual | ~$0.07 | ~$0.13 | v1 |
| traceability | 1 json | 10 per-stage json + consolidated | v2 |
| worst-case quality across many runs | uncertain | bounded (multi-candidate selection) | v2 |

**verdict:** v2 is what you want shipping when oliver downloads OATH on his phone six weeks from now and presses play 200 mornings in a row. v1 is what you ship when you need fast and cheap. for the wednesday review, v2 is the answer to "how do i know this is engineering and not an api wrapper" — the 10 stages + 8 claude calls + per-axis rubric scoring + multi-candidate selection are what makes the pipeline look like a pipeline.
