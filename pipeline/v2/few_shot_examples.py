"""few-shot examples for stage 2 candidate generation.

these are the winners from prompt 2's monday-night 15-script experiment, each
annotated with why it works. injected into stage 2 system prompts as concrete
demonstrations of the structural arc.
"""

FEW_SHOT_EXAMPLES = {
    "hardest_work": [
        {
            "intent": "ship the OATH v1 spec to github and send Oliver the link before noon",
            "first_action": "open the spec doc and write the wedge section",
            "hero": "Kobe Bryant",
            "phrase": "trust the work",
            "script": """It is early.
The room is dark.
You are already behind.

Last night you swore you would ship the OATH v1 spec to GitHub
and send Oliver the link before noon.
That was not a wish.
That was a contract.

Kobe was in the gym at 4am.
Not because the doors opened early.
Because he was already there.
No crowd. No camera. Eight hundred makes before the sun came up.
The work happened before anyone else started their day.

This is the same.

Trust the work.

Sixty minutes. Phone face down.
Open the spec doc.
Write the wedge section.
One section becomes the whole.
The whole becomes the link.
The link goes to Oliver before noon.

Nothing else exists until the wedge section is done.

Write.""",
            "why_strong": "Opens with concrete groggy reality (3 short lines). Quotes user's intent verbatim by line 6. Kobe anchor uses specific time (4am) and place (the gym) with concrete numbers (eight hundred makes), no invented quotes. Grounding phrase lands as a single line beat. Closes with escalating chain: open → write → link, then a single-verb command.",
        }
    ],
    "gym_now": [
        {
            "intent": "do the morning lift before opening any work doc",
            "first_action": "put shorts on and walk to the gym",
            "hero": "David Goggins",
            "phrase": "no one is coming, it's on you",
            "script": """Up.
Feet on the floor.
Shorts on. Now.

David Goggins ran 100 miles on two stress-fractured feet.
He didn't negotiate with the bed.
He didn't check his phone.
He put his shoes on in the dark and moved.

That's not inspiration. That's just what the body does when the mind has already decided.

You already decided.
Last night, you said it out loud:
"Do the morning lift before opening any work doc."

That decision is done. It's not up for review.
The only question left is mechanical.

No one is coming. It's on you.

Shorts are on.
Water bottle in hand.
Front door.
Walk to the gym.

Not the whole workout.
Not the whole day.
Just the door.
Open it.
Step through.
The bar is already loaded with your name.""",
            "why_strong": "Opens with body-cue commands stacked on top of each other (Up. Feet on the floor. Shorts on. Now.). Hero anchor uses a verified fact (100 miles on stress-fractured feet) without invented dialogue. 'That decision is done. It's not up for review.' converts the night-before commitment into closed accountability. Closes with chunked imperatives that narrow the world to the next 5 minutes.",
        }
    ],
    "grounding_phrases": [
        {
            "intent": "finish the OATH spec without doomscrolling first",
            "first_action": "open the laptop and close every other tab",
            "hero": "Marcus Aurelius",
            "phrase": "the work is the way",
            "script": """the work is the way.


the work is the way.


Every morning before Rome woke, Marcus Aurelius wrote.
Not to be read.
Not to be remembered.
Because the work was the only way he knew to be himself.


the work is the way.


Last night you swore you would finish the OATH spec without doomscrolling first.

That is still true.
It is true right now.
It is the only thing that is true right now.


Open the laptop.
Close every other tab.
One tab.
The spec.
Nothing else exists until that is done.


the work is the way.


Not after coffee.
Not after one scroll.
Not after you feel ready.

Now.


Begin.""",
            "why_strong": "Phrase repeated 4 times with full breath-line spacing between. Aurelius anchor is short and never explained. 'Not after coffee. Not after one scroll. Not after you feel ready.' is the literal anti-feed thesis embedded in the script. Closes with single-verb 'Begin.' — no preamble, no caveat.",
        }
    ],
}


def render_for_prompt(mode: str) -> str:
    """render the few-shot example for inclusion in the stage 2 system prompt."""
    examples = FEW_SHOT_EXAMPLES.get(mode, [])
    if not examples:
        return ""
    ex = examples[0]
    return (
        "EXAMPLE OF A STRONG " + mode.upper() + " SCRIPT:\n\n"
        f'For these inputs:\n'
        f'  intent: "{ex["intent"]}"\n'
        f'  first_action: "{ex["first_action"]}"\n'
        f'  hero: {ex["hero"]}\n'
        f'  phrase: "{ex["phrase"]}"\n\n'
        f'A strong script is:\n\n'
        f'---\n{ex["script"]}\n---\n\n'
        f'Why this works: {ex["why_strong"]}\n\n'
        f'Match this caliber for the user inputs below. Do not copy phrases from the example; use it as a quality bar.'
    )
