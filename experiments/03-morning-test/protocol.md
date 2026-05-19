# morning test protocol

## the question

does the engine produce audio that, played the moment a real groggy person dismisses their alarm in bed, actually gets them out of bed and into the hardest task within 5 minutes?

## the only honest way to test this

run it on a real groggy person in a real bed at a real alarm time. monday → tuesday morning, kartik tests on himself.

## setup the night before

monday 11pm:
- pick the 3 strongest generated scripts from experiments/01-script-generation/
- run them through elevenlabs flash with a preset hype voice
- save audio files to phone
- set alarm for 6am tuesday
- write tomorrow's intent in a note app: "ship the v1 spec, all 4 sections, before 3pm"

## test execution

tuesday 6am:
- alarm fires
- before doing anything else, play ritual 1
- score: 1-5, did this make me want to get up
- score: 1-5, did it reference my intent in a way that felt real
- score: 1-5, did the voice feel natural or AI-slop
- repeat for ritual 2 and ritual 3
- after all 3, log: did i get out of bed? what was the gap between alarm and starting the hardest thing?

## what to log

`experiments/03-morning-test/results.md`:
- timestamp of alarm
- timestamp of getting out of bed
- timestamp of starting the hardest thing
- per-ritual scores
- one paragraph honest assessment: which ritual was strongest, what worked, what was cringe, what would change

## what success looks like

at least 1 of 3 rituals scores 4+ on "made me want to get up" and the user is out of bed within 3 minutes of alarm.

## what failure looks like

all 3 rituals score 3 or below on the get-up question. if this happens, the engine needs major iteration before wednesday or the spec needs to flag this as the open problem.
