import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'OATH',
  slug: 'oath',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'oath',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  platforms: ['ios'],
  ios: {
    bundleIdentifier: 'com.deep24.oath',
    supportsTablet: false,
    buildNumber: '1',
    infoPlist: {
      UIBackgroundModes: ['audio', 'fetch', 'remote-notification'],
      NSMicrophoneUsageDescription:
        'OATH may use the microphone for voice clone setup in future versions. Not used in v0.1.',
    },
  },
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'cover',
    backgroundColor: '#0A0B0F',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-audio',
    'expo-asset',
    'expo-secure-store',
    '@react-native-community/datetimepicker',
    [
      'expo-notifications',
      {
        color: '#F59E0B',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBase: process.env.EXPO_PUBLIC_API_BASE || 'https://web-ten-sand-37.vercel.app',
  },
});
