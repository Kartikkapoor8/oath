import '../global.css';
import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { View } from 'react-native';
import { colors } from '@/lib/design-system';
import { useGeistFonts } from '@/lib/fonts/useGeistFonts';
import { configureAudioSession } from '@/lib/audio/setup';
import {
  configureNotificationHandler,
  isAlarmFireResponse,
  setupAlarmCategory,
} from '@/lib/alarms/scheduler';
import { syncNotificationPermission } from '@/lib/notifications/permissions';
import { preGenerateNextRitual } from '@/lib/rituals/pre-generation';
import { getPreferences } from '@/lib/storage/preferences';

SplashScreen.preventAutoHideAsync().catch(() => {
  // already hidden
});

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export default function RootLayout() {
  const fontsReady = useGeistFonts();
  const coldStartHandled = useRef(false);

  useEffect(() => {
    configureNotificationHandler();
    setupAlarmCategory();
    configureAudioSession();
    syncNotificationPermission();
  }, []);

  useEffect(() => {
    if (!fontsReady) return;
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (isAlarmFireResponse(response)) {
          router.replace('/alarm/ritual');
        }
      },
    );
    return () => subscription.remove();
  }, [fontsReady]);

  useEffect(() => {
    if (!fontsReady || coldStartHandled.current) return;
    coldStartHandled.current = true;
    (async () => {
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (last && isAlarmFireResponse(last)) {
          setTimeout(() => router.replace('/alarm/ritual'), 200);
        }
      } catch (err) {
        console.warn('cold-start notification check failed', err);
      }
    })();
  }, [fontsReady]);

  useEffect(() => {
    if (!fontsReady) return;
    (async () => {
      try {
        const prefs = await getPreferences();
        if (!prefs.hasOnboarded) return;
        if (!prefs.nextRitualGeneratedAt) return;
        const ageMs =
          Date.now() - new Date(prefs.nextRitualGeneratedAt).getTime();
        if (ageMs > TWELVE_HOURS_MS) {
          preGenerateNextRitual().catch((err) =>
            console.warn('background re-gen failed', err),
          );
        }
      } catch (err) {
        console.warn('stale-check failed', err);
      }
    })();
  }, [fontsReady]);

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
          >
            <Stack.Screen
              name="modals/intent-capture"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
              }}
            />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
