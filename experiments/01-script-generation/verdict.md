# script generation verdict — monday night

15 scripts generated (3 modes × 5 variants) using claude sonnet 4.6 with the three-layer prompt system documented in [prompts.md](prompts.md). all 15 passed banned-phrase validation (zero violations across the run). two grounding_phrases variants came in slightly under the 100-word floor (88 and 99 words) but were accepted with WARN status — the grounding mode is structurally sparse by design.

below: the 3 picks for the 6am morning test, plus an honest assessment of patterns across the full run.

## the 3 picks

### hardest_work — default
[`outputs/hardest_work__default.txt`](outputs/hardest_work__default.txt)

why this one over the other 4 variants: the hero anchor is the most concrete of any hardest_work variant — "Eight hundred makes before the sun came up. The work happened before anyone else started their day" — specific number, specific scene, no invented quote. the escalation "One section becomes the whole. The whole becomes the link. The link goes to Oliver before noon" walks the user backward from the deadline to the immediate first keystroke, which is exactly the cognitive move a groggy person needs. closing verb "Write." is the hardest single-syllable command of all five variants.

### gym_now — default
[`outputs/gym_now__default.txt`](outputs/gym_now__default.txt)

why this one: starts with four body cues stacked on top of each other ("Up. Feet on the floor. Shorts on. Now.") — the only variant where the body is literally moving before the hero anchor lands. the hero moment "David Goggins ran 100 miles on two stress-fractured feet. He didn't negotiate with the bed" is concrete and sourceable, and the line "That decision is done. It's not up for review" turns the night-before commitment into a closed contract rather than an open question. closing imagery "The bar is already loaded with your name" gives the user a visual destination, not just a verb.

### grounding_phrases — grounding_heavy
[`outputs/grounding_phrases__grounding_heavy.txt`](outputs/grounding_phrases__grounding_heavy.txt)

why this one: the phrase "the work is the way" lands 3 times with full pauses between, exactly as the mode is supposed to behave. the aurelius reference stays minimal — 4 short lines — and never lapses into hero-anchor territory, which is correct for this mode. but the load-bearing line is "Not after coffee. Not after one scroll. Not after you feel ready. Now." — this is literally the anti-feed thesis of the entire app, expressed inside a script. that line alone is why this variant beats default for the morning test. the default grounding script is good but doesn't have the explicit anti-feed shot.

## what worked across the 15

- **specific numbers in the hero anchor consistently outperformed vague references.** "800 makes", "100 miles", "four hundred words by lamplight" all landed harder than the few variants that drifted into "kobe practiced a lot" territory. add to layer 1 in the next prompt iteration: a numbered habit is non-negotiable.
- **the "you swore" / "you said it last night" anchoring pattern worked every single time.** binding the script to the user's own past self is more powerful than any external motivation. this is the wedge expressed inside the script. keep it.
- **single-verb closings ("write.", "begin.", "go.", "open it.") landed harder than multi-word closings.** the model occasionally drifted to compound closings (e.g., "open the laptop and begin"). enforce single-verb close in the next iteration.
- **the "not X. not Y. not Z." chunking pattern emerged organically in multiple variants** and consistently worked. it narrows the user's mental field from "the whole day" to "this exact next minute." consider adding an example of this pattern to layer 1.

## what didn't work across the 15

- **the grounding_phrases mode came in under target word count for 2 of 5 variants** (88 and 99 words vs. target ~150). the mode is structurally sparse by design — phrase, beat, phrase, beat — so the 130-200 target doesn't fit it well. fix in next iteration: give grounding mode a 100-150 word target, not 130-200.
- **the hero numbers were occasionally fuzzy** — kobe's pre-dawn make count varied across variants (400, 600, 800). all plausible per public sources, but inconsistent. the prompt should say "use a number that is verifiable from public sources or omit the number entirely" to prevent drift toward invented specifics.
- **the more_narrative variant occasionally lost urgency.** the longer story-shaped beats are pleasant but can sap the "get up now" energy. for the morning test we're skipping more_narrative entirely; in a future iteration, the more_narrative overlay should add a "still must end with a kinetic command" reminder so the longer middle doesn't soften the close.
- **the user's intent was sometimes broken into fragments** rather than spoken as a complete sentence. (e.g., "the spec. finished." instead of "ship the OATH v1 spec to github and send Oliver the link before noon" spoken whole.) in the next iteration, add to layer 1: "use the user's intent verbatim, as a complete sentence, at least once in the script."

## prompt changes to test after the morning report

1. **layer 1 addition:** "use the user's intent verbatim as a complete sentence at least once. fragments and rewordings of the intent do not count."
2. **layer 1 addition:** "the hero anchor must include a number (a count of reps, miles, hours, or a specific time of day). if no verifiable number is available, omit the hero entirely."
3. **mode-specific word target:** grounding_phrases gets 100-150 word target (not 130-200). update word count validation in `generate_script.py` to use a mode-specific range.
4. **variant-specific reminder:** the `more_narrative` overlay should explicitly state "the final command remains kinetic and single-verb. do not soften the close."
