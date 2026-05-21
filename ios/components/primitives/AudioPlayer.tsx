import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Play, Pause } from 'lucide-react-native';
import { colors, radius, spacing, duration } from '@/lib/design-system';
import { Text } from './Text';

export interface AudioPlayerProps {
  source: string;
  onPlaybackComplete?: () => void;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ source, onPlaybackComplete }: AudioPlayerProps) {
  const player = useAudioPlayer({ uri: source });
  const status = useAudioPlayerStatus(player);

  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  useEffect(() => {
    if (status.playing) {
      pulse.value = withRepeat(
        withTiming(1.05, {
          duration: 750,
          easing: Easing.inOut(Easing.cubic),
        }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: duration.fast });
    }
    return () => {
      cancelAnimation(pulse);
    };
  }, [status.playing, pulse]);

  useEffect(() => {
    if (status.didJustFinish) {
      onPlaybackComplete?.();
    }
  }, [status.didJustFinish, onPlaybackComplete]);

  const progress =
    status.duration && status.duration > 0
      ? Math.min(1, status.currentTime / status.duration)
      : 0;

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.bg.raised,
        borderRadius: radius['2xl'],
        padding: spacing[5],
        alignItems: 'center',
        gap: spacing[4],
      }}
    >
      <Animated.View style={pulseStyle}>
        <Pressable
          onPress={togglePlayback}
          accessibilityRole="button"
          accessibilityLabel={status.playing ? 'Pause' : 'Play'}
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.amber.DEFAULT,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.amber.DEFAULT,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 12,
          }}
        >
          {status.playing ? (
            <Pause color={colors.bg.DEFAULT} size={36} strokeWidth={2.5} />
          ) : (
            <Play
              color={colors.bg.DEFAULT}
              size={36}
              strokeWidth={2.5}
              style={{ marginLeft: 4 }}
            />
          )}
        </Pressable>
      </Animated.View>

      <View style={{ alignSelf: 'stretch', gap: spacing[2] }}>
        <View
          style={{
            height: 4,
            backgroundColor: colors.border.medium,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              backgroundColor: colors.amber.DEFAULT,
            }}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text variant="bodySm" color={colors.fg.muted}>
            {formatTime(status.currentTime)}
          </Text>
          <Text variant="bodySm" color={colors.fg.muted}>
            {formatTime(status.duration ?? 0)}
          </Text>
        </View>
      </View>
    </View>
  );
}
