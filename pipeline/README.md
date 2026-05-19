# pipeline

three-stage engine that turns user inputs (heroes, grounding phrases, mode, last night's intent) into a 45-90 second audio ritual played at alarm dismiss.

- generate_script.py: produces the text script from inputs
- synthesize_audio.py: converts script to audio via elevenlabs flash
- run.py: orchestrator, ties it together

usage (tuesday):

`python run.py --mode hardest_work --intent "ship the spec" --hero "kobe" --phrase "trust the work"`
