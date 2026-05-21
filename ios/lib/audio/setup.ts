import { setAudioModeAsync } from 'expo-audio';

let configured = false;

export async function configureAudioSession() {
  if (configured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      // true so the morning ritual keeps playing if the user pockets the
      // phone or walks across the room. UIBackgroundModes: ['audio'] is set
      // in app.config.ts so the entitlement is in place.
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
      interruptionModeAndroid: 'duckOthers',
    });
    configured = true;
  } catch (err) {
    console.warn('configureAudioSession failed', err);
  }
}
