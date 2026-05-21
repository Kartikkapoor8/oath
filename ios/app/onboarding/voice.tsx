import { useEffect, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Play, Square } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { OnboardingShell, OnboardingHeader } from '@/components/onboarding/OnboardingShell';
import { Card, Text } from '@/components/primitives';
import { colors, radius, spacing } from '@/lib/design-system';
import { setPreferences } from '@/lib/storage/preferences';
import { voiceLabel, voiceReference } from '@/lib/helpers/onboarding-defaults';
import type { VoicePreset } from '@/lib/api/oath-engine';

const PRESETS: VoicePreset[] = [
  'the_closer',
  'the_drill',
  'the_stoic',
  'the_coach',
  'the_friend',
];

const SAMPLES: Record<VoicePreset, number> = {
  the_closer: require('../../assets/audio/voice-presets/closer.mp3'),
  the_drill: require('../../assets/audio/voice-presets/drill.mp3'),
  the_stoic: require('../../assets/audio/voice-presets/stoic.mp3'),
  the_coach: require('../../assets/audio/voice-presets/coach.mp3'),
  the_friend: require('../../assets/audio/voice-presets/friend.mp3'),
};

export default function Voice() {
  const [selected, setSelected] = useState<VoicePreset | null>(null);
  const [previewing, setPreviewing] = useState<VoicePreset | null>(null);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (status.didJustFinish) setPreviewing(null);
  }, [status.didJustFinish]);

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  const togglePreview = (voice: VoicePreset) => {
    if (previewing === voice && status.playing) {
      player.pause();
      setPreviewing(null);
      return;
    }
    try {
      player.pause();
    } catch {}
    player.replace(SAMPLES[voice]);
    player.play();
    setPreviewing(voice);
  };

  const handleNext = async () => {
    const finalChoice = selected ?? 'the_closer';
    await setPreferences({ voicePreset: finalChoice });
    try {
      player.pause();
    } catch {}
    router.push('/onboarding/alarm-time');
  };

  const progress =
    status.duration && status.duration > 0
      ? Math.min(1, status.currentTime / status.duration)
      : 0;

  return (
    <OnboardingShell
      step={4}
      cta={{ label: 'next', disabled: false, onPress: handleNext }}
    >
      <OnboardingHeader
        caption="STEP 4 OF 6"
        title="Pick your voice."
        subtitle="five archetypes. tap the play icon to hear a sample. tap the card to choose."
      />

      <FlatList
        data={PRESETS}
        keyExtractor={(item) => item}
        contentContainerStyle={{ gap: spacing[3] }}
        renderItem={({ item }) => (
          <VoicePresetRow
            voice={item}
            isSelected={selected === item}
            isPlaying={previewing === item && status.playing}
            previewProgress={previewing === item ? progress : 0}
            onPreview={() => togglePreview(item)}
            onSelect={() => setSelected(item)}
          />
        )}
        scrollEnabled={false}
      />
    </OnboardingShell>
  );
}

interface VoicePresetRowProps {
  voice: VoicePreset;
  isSelected: boolean;
  isPlaying: boolean;
  previewProgress: number;
  onPreview: () => void;
  onSelect: () => void;
}

const BUTTON_SIZE = 56;
const STROKE = 3;
const RADIUS = (BUTTON_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function VoicePresetRow({
  voice,
  isSelected,
  isPlaying,
  previewProgress,
  onPreview,
  onSelect,
}: VoicePresetRowProps) {
  return (
    <Pressable onPress={onSelect} accessibilityRole="button">
      <Card
        elevated={false}
        padding={4}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          borderColor: isSelected
            ? colors.amber.DEFAULT
            : colors.border.subtle,
          shadowColor: colors.amber.DEFAULT,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: isSelected ? 12 : 0,
          shadowOpacity: isSelected ? 0.25 : 0,
        }}
      >
        <View style={{ flex: 1, gap: spacing[1] }}>
          <Text variant="h3" color={colors.fg.DEFAULT}>
            {voiceLabel(voice)}
          </Text>
          <Text variant="caption" color={colors.fg.muted}>
            {voiceReference(voice)}
          </Text>
        </View>

        <Pressable
          onPress={onPreview}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? `Stop ${voiceLabel(voice)} preview` : `Play ${voiceLabel(voice)} preview`}
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
              strokeDashoffset={CIRC * (1 - previewProgress)}
              transform={`rotate(-90 ${BUTTON_SIZE / 2} ${BUTTON_SIZE / 2})`}
            />
          </Svg>
          <View
            style={{
              width: BUTTON_SIZE - 14,
              height: BUTTON_SIZE - 14,
              borderRadius: BUTTON_SIZE,
              backgroundColor: isPlaying
                ? colors.amber.bright
                : colors.amber.DEFAULT,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPlaying ? (
              <Square color={colors.bg.DEFAULT} size={16} fill={colors.bg.DEFAULT} />
            ) : (
              <Play
                color={colors.bg.DEFAULT}
                size={18}
                fill={colors.bg.DEFAULT}
                style={{ marginLeft: 2 }}
              />
            )}
          </View>
        </Pressable>
      </Card>
    </Pressable>
  );
}
