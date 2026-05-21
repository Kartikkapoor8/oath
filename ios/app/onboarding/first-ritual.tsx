import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Play, Pause } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Button, Text } from '@/components/primitives';
import { colors, fonts, spacing } from '@/lib/design-system';
import { getPreferences } from '@/lib/storage/preferences';
import { voiceLabel } from '@/lib/helpers/onboarding-defaults';
import { dataUrlToFileUri } from '@/lib/audio/dataUrlToFile';
import type { VoicePreset } from '@/lib/api/oath-engine';

const FALLBACK_RITUAL = require('../../assets/audio/fallback-ritual.mp3');

const BUTTON_SIZE = 120;
const STROKE = 4;
const RADIUS = (BUTTON_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function FirstRitual() {
  const [source, setSource] = useState<string | number | null>(null);
  const [script, setScript] = useState('');
  const [voice, setVoice] = useState<VoicePreset>('the_closer');
  const [retries, setRetries] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const prefs = await getPreferences();
      if (prefs.firstRitualScript) setScript(prefs.firstRitualScript);
      if (prefs.firstRitualVoice) setVoice(prefs.firstRitualVoice);

      if (prefs.firstRitualAudioUrl) {
        try {
          if (prefs.firstRitualAudioUrl.startsWith('data:')) {
            const uri = await dataUrlToFileUri(
              prefs.firstRitualAudioUrl,
              'first-ritual.mp3',
            );
            setSource(uri);
          } else {
            setSource(prefs.firstRitualAudioUrl);
          }
        } catch (err) {
          console.warn('failed to materialise audio url', err);
          setLoadError('audio is finalizing... give it a beat and tap retry.');
          setSource(FALLBACK_RITUAL);
        }
      } else {
        setSource(FALLBACK_RITUAL);
      }
    })();
  }, [retries]);

  const player = useAudioPlayer(source as never);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!source) return;
    const t = setTimeout(() => {
      try {
        player.play();
      } catch (err) {
        console.warn('autoplay failed', err);
      }
    }, 800);
    return () => clearTimeout(t);
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

  const progress = useMemo(() => {
    if (!status.duration || status.duration <= 0) return 0;
    return Math.min(1, status.currentTime / status.duration);
  }, [status.currentTime, status.duration]);

  const togglePlayback = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  const handleAdvance = () => {
    try {
      player.pause();
    } catch {}
    router.replace('/paywall');
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}
    >
      <View
        style={{
          paddingHorizontal: spacing[6],
          paddingTop: spacing[4],
          gap: spacing[2],
          alignItems: 'center',
        }}
      >
        <Text variant="caption" color={colors.fg.muted}>
          YOUR FIRST RITUAL
        </Text>
        <Text
          variant="h2"
          color={colors.fg.DEFAULT}
          style={{ textAlign: 'center' }}
        >
          future you wrote this for you
        </Text>
        <Text variant="caption" color={colors.fg.muted}>
          {`${voiceLabel(voice)} · ${
            status.duration && status.duration > 0
              ? `${Math.round(status.duration)} seconds`
              : 'loading...'
          }`}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing[6],
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
                width: BUTTON_SIZE - 28,
                height: BUTTON_SIZE - 28,
                borderRadius: BUTTON_SIZE,
                backgroundColor: colors.amber.DEFAULT,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.amber.DEFAULT,
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 32,
                shadowOpacity: 0.5,
              }}
            >
              {status.playing ? (
                <Pause
                  color={colors.bg.DEFAULT}
                  size={40}
                  strokeWidth={2.5}
                  fill={colors.bg.DEFAULT}
                />
              ) : (
                <Play
                  color={colors.bg.DEFAULT}
                  size={40}
                  strokeWidth={2.5}
                  fill={colors.bg.DEFAULT}
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
          </Pressable>
        </Animated.View>

        <Text
          variant="mono"
          color={colors.fg.muted}
          style={{
            fontFamily: fonts.mono,
            marginTop: spacing[5],
          }}
        >
          {`${formatTime(status.currentTime)} / ${formatTime(status.duration ?? 0)}`}
        </Text>

        {loadError ? (
          <Pressable
            onPress={() => setRetries((r) => r + 1)}
            accessibilityRole="button"
            style={{ marginTop: spacing[4] }}
          >
            <Text variant="bodySm" color={colors.amber.bright}>
              {loadError} · tap to retry
            </Text>
          </Pressable>
        ) : null}

        {script ? (
          <View
            style={{
              alignSelf: 'stretch',
              marginTop: spacing[8],
              maxHeight: 80,
              position: 'relative',
            }}
          >
            <Text
              variant="bodySm"
              color={colors.fg.muted}
              numberOfLines={3}
              style={{ textAlign: 'center' }}
            >
              {script}
            </Text>
            <LinearGradient
              colors={['transparent', colors.bg.DEFAULT]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 24,
              }}
              pointerEvents="none"
            />
          </View>
        ) : null}
      </View>

      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[8],
          gap: spacing[3],
        }}
      >
        <Button label="this is incredible — let’s go" onPress={handleAdvance} />
        <Button label="skip for now" variant="ghost" onPress={handleAdvance} />
      </View>
    </SafeAreaView>
  );
}
