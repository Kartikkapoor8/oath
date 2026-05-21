import { useFonts } from 'expo-font';

// Centralised font loader. Until the Geist TTF files are dropped into
// ios/assets/fonts/ (see ios/README.md "Blockers"), uncomment the require
// lines below to enable font loading. With them commented out the app
// falls back to the system font (San Francisco on iOS), which is fine
// for placeholder development but ships the wrong typography to TestFlight.
//
// When you add the TTFs:
//   1. Drop the six files into ios/assets/fonts/
//   2. Uncomment the FONT_MAP entries
//   3. Restart Metro (`npx expo start --clear`)

const FONT_MAP: Record<string, ReturnType<typeof require>> = {
  // 'Geist-Regular':   require('../../assets/fonts/Geist-Regular.ttf'),
  // 'Geist-Medium':    require('../../assets/fonts/Geist-Medium.ttf'),
  // 'Geist-SemiBold':  require('../../assets/fonts/Geist-SemiBold.ttf'),
  // 'Geist-Bold':      require('../../assets/fonts/Geist-Bold.ttf'),
  // 'GeistMono-Regular': require('../../assets/fonts/GeistMono-Regular.ttf'),
  // 'GeistMono-Medium':  require('../../assets/fonts/GeistMono-Medium.ttf'),
};

export function useGeistFonts(): boolean {
  const [loaded, error] = useFonts(FONT_MAP);
  return loaded || !!error;
}
