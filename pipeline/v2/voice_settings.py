"""voice preset map + per-mode voice settings for the v2 synthesizer."""

# same ids as v1 (elevenlabs default voices, shipped with every account)
VOICE_PRESET_MAP = {
    "the_closer":  ("pNInz6obpgDQGcFmaJgB", "Adam"),
    "the_drill":   ("VR6AewLTigWG4xSOukaG", "Arnold"),
    "the_stoic":   ("onwK4e9ZLuTAKqWW03F9", "Daniel"),
    "the_coach":   ("nPczCjzI2devNBz1zQrb", "Brian"),
    "the_friend":  ("ErXwobaYiN019PkySvjV", "Antoni"),
}

# per-mode voice settings — tuned for the cadence each mode needs.
# hardest_work: authoritative, grounded, low style variation
# gym_now:      kinetic, dynamic, more style variation for hype
# grounding_phrases: very stable, very similar, low style — liturgical
MODE_VOICE_SETTINGS = {
    "hardest_work": {
        "stability": 0.6,
        "similarity_boost": 0.8,
        "style": 0.2,
        "use_speaker_boost": True,
    },
    "gym_now": {
        "stability": 0.4,
        "similarity_boost": 0.7,
        "style": 0.5,
        "use_speaker_boost": True,
    },
    "grounding_phrases": {
        "stability": 0.7,
        "similarity_boost": 0.85,
        "style": 0.1,
        "use_speaker_boost": False,
    },
}

# fallback for any mode not in the per-mode table (matches v1 defaults)
DEFAULT_VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.3,
    "use_speaker_boost": True,
}


def get_voice_settings(mode: str) -> dict:
    return MODE_VOICE_SETTINGS.get(mode, DEFAULT_VOICE_SETTINGS)
