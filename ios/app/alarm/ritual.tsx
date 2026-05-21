import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Play, Pause } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Button, Text } from '@/components/primitives';
import { colors, fonts, spacing } from '@/lib/design-system';
import {
  getPreferences,
  setPreferences,
} from '@/lib/storage/preferences';
import { getDefaultFirstAction } from '@/lib/helpers/onboarding-defaults';

const FALLBACK_RITUAL = require('../../assets/audio/fallback-ritual.mp3');

const BUTTON_SIZE = 160;
const STROKE = 5;
const RADIUS = (BUTTON_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
const ACTION_REVEAL_AT_S = 30;
const ACTION_REVEAL_AT_PCT = 0.8;

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function splitScriptLines(script: string): string[] {
  return script
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export default function Ritual() {
  const [source, setSource] = useState<string | number | null>(null);
  const [script, setScript] = useState('');
  const [firstAction, setFirstAction] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [now] = useState(new Date());
  const completedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const prefs = await getPreferences();
      setScript(prefs.nextRitualScript ?? '');
      setFirstAction(
        prefs.nextRitualFirstAction ||
          prefs.tomorrowFirstAction ||
          getDefaultFirstAction(prefs.defaultMode),
      );

      if (prefs.nextRitualPath) {
        try {
          const info = await FileSystem.getInfoAsync(prefs.nextRitualPath);
          if (info.exists) {
            setSource(prefs.nextRitualPath);
            return;
          }
        } catch (err) {
          console.warn('failed to stat cached ritual', err);
        }
      }
      setUsingFallback(true);
      setSource(FALLBACK_RITUAL);
    })();
  }, []);

  const player = useAudioPlayer(source as never);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!source) return;
    try {
      player.play();
    } catch (err) {
      console.warn('autoplay failed', err);
    }
  }, [source, player]);

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (status.playing) {
      pulse.value = withRepeat(
        withTiming(1.02, {
          duration: 750,
          easing: Easing.inOut(Easing.cubic),
        }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 200 });
    }
    return () => cancelAnimation(pulse);
  }, [status.playing, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const duration = status.duration ?? 0;
  const progress =
    duration > 0 ? Math.min(1, status.currentTime / duration) : 0;
  const fullyPlayed = !!status.didJustFinish;
  const revealThreshold =
    status.currentTime >= ACTION_REVEAL_AT_S ||
    (duration > 0 && progress >= ACTION_REVEAL_AT_PCT);

  const lines = useMemo(() => splitScriptLines(script), [script]);
  const currentLineIdx = useMemo(() => {
    if (lines.length === 0) return -1;
    if (duration <= 0) return 0;
    const idx = Math.floor(progress * lines.length);
    return Math.min(idx, lines.length - 1);
  }, [progress, duration, lines.length]);

  const currentLine =
    currentLineIdx >= 0 ? lines[currentLineIdx] : '';

  const togglePlayback = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  const handleComplete = async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      player.pause();
    } catch {}
    await setPreferences({
      lastRitualCompletedAt: new Date().toISOString(),
      lastRitualCompletedFully: fullyPlayed,
    });
    router.replace('/(tabs)/home');
  };

  const greetingTime = `${now
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .toUpperCase()} · ${now
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase()}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}>
      <StatusBar style="light" hidden />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View
          style={{
            paddingTop: spacing[4],
            paddingHorizontal: spacing[6],
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <Text variant="caption" color={colors.fg.muted}>
            YOUR RITUAL
          </Text>
          <Text variant="caption" color={colors.fg.subtle}>
            {greetingTime}
          </Text>
          {usingFallback ? (
            <Text variant="caption" color={colors.warn}>
              SAMPLE RITUAL · TONIGHT&apos;S WILL BE PERSONAL
            </Text>
          ) : null}
        </View>

        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing[6],
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[5],
          }}
        >
          <Animated.View style={pulseStyle}>
            <Pressable
              onPress={togglePlayback}
              accessibilityRole="button"
              accessibilityLabel={status.playing ? 'Pause' : 'Play'}
              style={{
                width: BUTTON_SIZE,
                height: BUTTON_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg
                width={BUTTON_SIZE}
                height={BUTTON_SIZE}
                style={{ position: 'absolute' }}
              >
                <Circle
                  cx={BUTTON_SIZE / 2}
                  cy={BUTTON_SIZE / 2}
                  r={RADIUS}
                  stroke={colors.border.medium}
                  strokeWidth={STROKE}
                  fill="transparent"
                />
                <Circle
                  cx={BUTTON_SIZE / 2}
                  cy={BUTTON_SIZE / 2}
                  r={RADIUS}
                  stroke={colors.amber.bright}
                  strokeWidth={STROKE}
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress)}
                  transform={`rotate(-90 ${BUTTON_SIZE / 2} ${BUTTON_SIZE / 2})`}
                />
              </Svg>
              <View
                style={{
                  width: BUTTON_SIZE - 36,
                  height: BUTTON_SIZE - 36,
                  borderRadius: BUTTON_SIZE,
                  backgroundColor: colors.amber.DEFAULT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: colors.amber.DEFAULT,
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 40,
                  shadowOpacity: 0.55,
                }}
              >
                {status.playing ? (
                  <Pause
                    color={colors.bg.DEFAULT}
                    size={52}
                    strokeWidth={2.5}
                    fill={colors.bg.DEFAULT}
                  />
                ) : (
                  <Play
                    color={colors.bg.DEFAULT}
                    size={52}
                    strokeWidth={2.5}
                    fill={colors.bg.DEFAULT}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>
            </Pressable>
          </Animated.View>

          <Text
            color={colors.fg.muted}
            style={{
              fontFamily: fonts.mono,
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {`${formatTime(status.currentTime)} / ${formatTime(duration)}`}
          </Text>

          {currentLine ? (
            <View
              style={{
                minHeight: 80,
                alignSelf: 'stretch',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Animated.View
                key={currentLineIdx}
                entering={FadeIn.duration(400)}
                exiting={FadeOut.duration(200)}
                style={{
                  paddingHorizontal: spacing[2],
                }}
              >
                <Text
                  variant="bodyLg"
                  color={colors.amber.bright}
                  style={{ textAlign: 'center', fontFamily: fonts.body }}
                >
                  {currentLine}
                </Text>
              </Animated.View>
            </View>
          ) : null}
        </View>

        <View
          style={{
            paddingHorizontal: spacing[5],
            paddingBottom: spacing[8],
            minHeight: 80,
            justifyContent: 'flex-end',
          }}
        >
          {revealThreshold ? (
            <Animated.View entering={FadeIn.duration(600)}>
              <Button
                label={
                  fullyPlayed
                    ? `done — start ${firstAction}`.toUpperCase()
                    : `i'm up — start ${firstAction}`.toUpperCase()
                }
                onPress={handleComplete}
              />
            </Animated.View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}
