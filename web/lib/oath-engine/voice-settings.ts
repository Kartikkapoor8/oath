// MIRROR OF: pipeline/v2/voice_settings.py — keep in sync

export const VOICE_PRESET_MAP: Record<string, { id: string; label: string }> = {
  the_closer: { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam' },
  the_drill: { id: 'VR6AewLTigWG4xSOukaG', label: 'Arnold' },
  the_stoic: { id: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel' },
  the_coach: { id: 'nPczCjzI2devNBz1zQrb', label: 'Brian' },
  the_friend: { id: 'ErXwobaYiN019PkySvjV', label: 'Antoni' },
};

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export const MODE_VOICE_SETTINGS: Record<string, VoiceSettings> = {
  hardest_work: {
    stability: 0.6,
    similarity_boost: 0.8,
    style: 0.2,
    use_speaker_boost: true,
  },
  gym_now: {
    stability: 0.4,
    similarity_boost: 0.7,
    style: 0.5,
    use_speaker_boost: true,
  },
  grounding_phrases: {
    stability: 0.7,
    similarity_boost: 0.85,
    style: 0.1,
    use_speaker_boost: false,
  },
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.3,
  use_speaker_boost: true,
};

export function getVoiceSettings(mode: string): VoiceSettings {
  return MODE_VOICE_SETTINGS[mode] ?? DEFAULT_VOICE_SETTINGS;
}
