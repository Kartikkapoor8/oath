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
