# morning test results — tuesday may 20 2026, 6am

## timestamps

- alarm fired:                    6:00 am
- got out of bed:                 ~6:08 am (after all 3 rituals played back-to-back, didn't get up during any of them)
- started first action:           ~6:23 am (the gap was real — opened the laptop only after coffee)
- gap from alarm to bed-exit:     ~8 minutes (past the 3-minute success threshold)
- gap from alarm to first action: ~23 minutes

## per-ritual scores

3 rituals, scored honestly. 1-5 scale per axis; overall is /10 (rough weighted average).

### ritual 1 — `hardest_work__default`
- made me want to get up:  2 / 5
- felt made for me:        2 / 5
- voice felt natural:      3 / 5
- **overall: 4 / 10**
- one-sentence reaction: read fine when awake, felt like a podcast intro in bed.

### ritual 2 — `gym_now__default`
- made me want to get up:  1 / 5
- felt made for me:        1 / 5
- voice felt natural:      3 / 5
- **overall: 3 / 10**
- one-sentence reaction: the body-cue opening worked for half a second, then it became goggins trivia and i was out.

### ritual 3 — `grounding_phrases__grounding_heavy`
- made me want to get up:  2 / 5
- felt made for me:        3 / 5
- voice felt natural:      2 / 5
- **overall: 4 / 10**
- one-sentence reaction: the silence and repetition didn't require performative motivation, which is why this one felt closest to actually landing.

## honest assessment

the scripts read fine when awake but at 6am in bed they felt like text-to-speech narration, not a ritual. the voice was clean but lacked the urgency a real groggy human needs. the hero anchors (kobe, goggins, marcus aurelius) felt like name-drops, not earned references — the structural arc was correct, but it didn't compensate for thin emotional impact. grounding_phrases mode (the highest scorer at 4/10) felt closest to working because the silence and repetition didn't require performative motivation. worth doubling down on.

## voice character feedback (the_closer = elevenlabs adam)

adam was clean, even, articulate. for an audiobook he'd be a great pick. for an alarm ritual at 6am to a body that hasn't moved yet, he was too smooth — the voice didn't carry weight or urgency. the_drill (arnold) might have helped gym_now. for grounding_phrases the_friend (antoni, peer energy) might have worked better than authority. the_closer was probably the wrong default voice for the morning test, but the deeper issue is the scripts, not the voice.

## what i'd change for v2

1. **lean harder into grounding_phrases mode.** the most differentiated mode and the highest scorer. silence as content, not narration. worth A/B testing more grounding variants and less narrative variants.
2. **the v2 pipeline is the architectural answer to "feels like narration, not ritual."** the 6-axis critique catches script-level weakness (cliché freedom, voice directness) and the prosody markup + mode-tuned voice settings address the audio-level weakness. v2 is already shipped — verify it audibly outperforms v1 on grounding mode specifically.
3. **n=5+ friends test before claiming the engine works.** kartik testing kartik is n=1 with full prior context. the real validation is strangers' inputs (their heroes, their phrases, their intent) — friends test by end of week 1 of v1.

## bottom line

- did i get out of bed within 3 minutes of the alarm: **no**
- did at least one ritual score 4+ on "made me want to get up": **no** (highest was 2/5)
- scenario per prompt 3's framing: **B (partial — engine produced honest output) on the spec language, but honestly closer to C (all 3 rituals failed to land at 6am)**

## what this means for v1

the audio engine works end-to-end and produces valid output, but the v1 scripts need a generational pipeline iteration before they reliably get a real person out of bed. the **v2 pipeline (10 stages, 6-axis critique, llm-as-judge, mode-tuned voice settings, prosody markup) was built specifically to address this.** the v2 judge caught patterns the v1 engine couldn't and the v2 audio (see `experiments/05-v2-vs-v1-comparison/`) added documented hero specifics + commitment framing + mode-tuned voice settings that v1 missed.

still: n=1 testing on the script author is the weakest possible signal. real validation requires n=5+ friends running the engine on their own inputs over week 1.

## what changes for the spec

- **the "open problem" section in `docs/01-spec.md` is this:** audio quality at 6am for a real groggy person. honest, not papered over.
- **the v2 pipeline is the short-term answer** — already built, already on github (`pipeline/v2/`), demoed live at the vercel page. wednesday review should walk oliver through the v2 trace as the response to the failed n=1 morning test.
- **friends test by end of week 1 is the validation plan.** if 3+ of 5 friends score a v2 ritual 7+/10 on their own inputs, the engine generalizes. if not, the wedge needs deeper reconsideration before ios development starts.
