import { setAudioModeAsync } from 'expo-audio';

let configured = false;

export async function configureAudioSession() {
  if (configured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
      interruptionModeAndroid: 'duckOthers',
    });
    configured = true;
  } catch (err) {
    console.warn('configureAudioSession failed', err);
  }
}
