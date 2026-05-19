// voice-presets.ts — shared client-safe voice preset metadata.
//
// the engine-bridge.ts file is server-only (contains api keys). this file is the
// safe-to-import-anywhere copy of the voice metadata for ui components.

export interface VoicePresetMeta {
  key: string;
  label: string;
  reference: string;
  description: string;
  sampleFile: string;
}

export const VOICE_PRESETS: VoicePresetMeta[] = [
  {
    key: 'the_closer',
    label: 'the_closer',
    reference: 'calm, authoritative — harvey specter energy',
    description:
      'deep, slow, measured. for the hardest work of the day, when you need someone in your corner who has been there.',
    sampleFile: '/voice-preset-closer.mp3',
  },
  {
    key: 'the_drill',
    label: 'the_drill',
    reference: 'sharp, clipped — drill sergeant energy',
    description:
      'cuts the negotiation. for the body, not the mind. when getting out of bed is the whole job and the rest follows.',
    sampleFile: '/voice-preset-drill.mp3',
  },
  {
    key: 'the_stoic',
    label: 'the_stoic',
    reference: 'measured, philosophical — marcus aurelius energy',
    description:
      'low affect, high weight. for calm mornings that need spaciousness, not force. the work is the way.',
    sampleFile: '/voice-preset-stoic.mp3',
  },
  {
    key: 'the_coach',
    label: 'the_coach',
    reference: 'warm, urgent mentor — phil jackson energy',
    description:
      'mentor cadence with urgency baked in. for narrative mornings where the script needs to feel like someone who has been there.',
    sampleFile: '/voice-preset-coach.mp3',
  },
  {
    key: 'the_friend',
    label: 'the_friend',
    reference: 'conversational peer — your closest friend energy',
    description:
      'peer energy, not authority. for grounding phrases mode where distance would break the spell.',
    sampleFile: '/voice-preset-friend.mp3',
  },
];

export const VOICE_DISCLAIMER =
  'cultural references describe the FEEL of each voice. oath uses ethically-sourced, licensed elevenlabs voices, never cloned identifiable people.';
