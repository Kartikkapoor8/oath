import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mode, VoicePreset } from '@/lib/api/oath-engine';

export interface UserPreferences {
  hero: string;
  groundingPhrase: string;
  defaultMode: Mode;
  voicePreset: VoicePreset;
  alarmTime: string | null;
  hasOnboarded: boolean;
  hasPaid: boolean;
  tomorrowIntent: string | null;
  tomorrowFirstAction: string | null;

  // First ritual generated during onboarding — played on /onboarding/first-ritual.
  firstRitualAudioUrl: string | null;
  firstRitualScript: string | null;
  firstRitualVoice: VoicePreset | null;
  firstRitualFinalScore: number | null;

  // Pre-generated ritual for the next alarm fire. Cached on device so the
  // morning playback has zero latency. Refreshed on intent change, alarm
  // time change, mode/voice change, or 12h staleness.
  nextRitualPath: string | null;
  nextRitualScript: string | null;
  nextRitualGeneratedAt: string | null;
  nextRitualVoice: VoicePreset | null;
  nextRitualFirstAction: string | null;
  nextRitualFinalScore: number | null;

  // Last completed ritual — set when the user taps the action button on
  // /alarm/ritual. Used by the home tab to show "completed at 6:02 AM".
  lastRitualCompletedAt: string | null;
  lastRitualCompletedFully: boolean;

  // Notification permission state, mirrored so we can show the right UI
  // without a permissions roundtrip on every screen.
  notificationsPermission: 'granted' | 'denied' | 'undetermined';
}

const STORAGE_KEY = 'oath_user_preferences_v1';

const defaults: UserPreferences = {
  hero: '',
  groundingPhrase: '',
  defaultMode: 'hardest_work',
  voicePreset: 'the_closer',
  alarmTime: null,
  hasOnboarded: false,
  hasPaid: false,
  tomorrowIntent: null,
  tomorrowFirstAction: null,
  firstRitualAudioUrl: null,
  firstRitualScript: null,
  firstRitualVoice: null,
  firstRitualFinalScore: null,
  nextRitualPath: null,
  nextRitualScript: null,
  nextRitualGeneratedAt: null,
  nextRitualVoice: null,
  nextRitualFirstAction: null,
  nextRitualFinalScore: null,
  lastRitualCompletedAt: null,
  lastRitualCompletedFully: false,
  notificationsPermission: 'undetermined',
};

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return { ...defaults, ...parsed };
  } catch (err) {
    console.error('failed to read preferences', err);
    return { ...defaults };
  }
}

export async function setPreferences(
  updates: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const current = await getPreferences();
  const merged = { ...current, ...updates };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export async function resetPreferences(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
