import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { colors } from '@/lib/design-system';
import { useGeistFonts } from '@/lib/fonts/useGeistFonts';
import { configureAudioSession } from '@/lib/audio/setup';

SplashScreen.preventAutoHideAsync().catch(() => {
  // already hidden
});

export default function RootLayout() {
  const fontsReady = useGeistFonts();

  useEffect(() => {
    configureAudioSession();
  }, []);

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: colors.bg.DEFAULT },
            }}
          />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
