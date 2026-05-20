# morning test results — tuesday may 20 2026, 6am

## timestamps

- alarm fired:                    6:00 am
- got out of bed:                 ~6:06 am (shortly after ritual 3 ended)
- started first action:           ~6:15 am (opened the laptop, closed every other tab)
- gap from alarm to bed-exit:     ~6 minutes (past the 3-minute success threshold)
- gap from alarm to first action: ~15 minutes

## per-ritual scores

3 rituals, scored honestly. 1-5 scale per axis; overall is /10 (rough weighted average).

### ritual 1 — `hardest_work__default`
- made me want to get up:  3 / 5
- felt made for me:        2 / 5
- voice felt natural:      3 / 5
- **overall: 5 / 10**
- one-sentence reaction: the intent quote at the start landed; the kobe anchor still felt like a name-drop and that's where the pull weakened.

### ritual 2 — `gym_now__default`
- made me want to get up:  2 / 5
- felt made for me:        2 / 5
- voice felt natural:      3 / 5
- **overall: 5 / 10**
- one-sentence reaction: the body-cue opening got me halfway to sitting up before the goggins block flattened the energy back out.

### ritual 3 — `grounding_phrases__grounding_heavy`
- made me want to get up:  4 / 5
- felt made for me:        3 / 5
- voice felt natural:      2 / 5
- **overall: 6 / 10**
- one-sentence reaction: the silence around the repeated phrase was the most ritual-feeling moment of the three — closest thing to actually working, and the only ritual that physically moved me.

## honest assessment

partial signal across all three, but none crossed the threshold of "i had to get up." the scripts read fine when awake but at 6am the hardest_work and gym_now rituals felt like narration of motivation rather than ritual itself — clean voice, real structure, but thin emotional weight. the hero anchors (kobe, goggins, marcus aurelius) functioned as name-drops more than earned references. grounding_phrases was the standout: the silence and repetition didn't require performative motivation, and it was the only one that actually moved my body. worth leaning into hard.

## voice character feedback (the_closer = elevenlabs adam)

adam is clean, even, articulate — for an audiobook he'd be a great pick. for an alarm ritual at 6am to a body that hasn't moved yet, he was too smooth. the voice didn't carry weight or urgency. the_drill (arnold) might have worked better for gym_now's body-cue opening. for grounding_phrases the_friend (antoni, peer energy) might be a better default than authority — peer voice + silence pairs naturally. the_closer was the wrong default for this morning test, but the deeper issue is the scripts, not the voice.

## what i'd change for v2

1. **lean harder into grounding_phrases mode.** the highest scorer and the only one that moved my body. silence as content, not narration. worth A/B testing more grounding variants and dropping more_narrative variants.
2. **the v2 pipeline is the architectural answer to "narration, not ritual."** the 6-axis critique catches script-level weakness (cliché freedom, voice directness) and the prosody markup + mode-tuned voice settings address the audio-level weakness. v2 is already shipped — verify it audibly outperforms v1 on grounding mode specifically.
3. **n=5+ friends test before claiming the engine works.** kartik testing kartik is n=1 with full prior context. real validation is strangers' inputs over week 1 of v1.

## bottom line

- did i get out of bed within 3 minutes of the alarm: **no** (~6 minutes)
- did at least one ritual score 4+ on "made me want to get up": **yes** (grounding_phrases at 4/5)
- scenario per prompt 3's framing: **B (partial pass)** — all three produced honest output, grounding crossed the 4+ threshold, none reached the 7+/10 transformative line

## what this means for v1

the audio engine works end-to-end and produces output with real signal. grounding_phrases mode is closest to ritual; the other two modes read like narration at 6am. the **v2 pipeline (10 stages, 6-axis critique, llm-as-judge, mode-tuned voice settings, prosody markup) was built specifically to address the script-quality gap.** the v2 judge caught patterns the v1 engine couldn't, and the v2 audio (see `experiments/05-v2-vs-v1-comparison/`) added documented hero specifics + commitment framing + mode-tuned voice settings that v1 missed.

still: n=1 with the script author is the weakest possible signal. real validation requires n=5+ friends running the engine on their own inputs.

## what changes for the spec

- **the "open problem" section in `docs/01-spec.md` is this:** the v1 engine works but doesn't yet reliably get a groggy person out of bed at 6am. n=1 shows partial signal (5/5/6), not failure, and not yet success.
- **the v2 pipeline is the short-term answer** — already built, already on github (`pipeline/v2/`), demoed live at the vercel page. wednesday review walks oliver through the v2 trace as the response to the partial n=1 morning test.
- **friends test by end of week 1 is the validation plan.** if 3+ of 5 friends score a v2 ritual 7+/10 on their own inputs, the engine generalizes. if not, the wedge needs reconsideration before ios development starts.
