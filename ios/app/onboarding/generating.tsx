import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Button, Text } from '@/components/primitives';
import { colors, fonts, fontSize, spacing } from '@/lib/design-system';
import {
  generateRitual,
  PipelineError,
  type PipelineInputs,
  type StageEvent,
  type StageId,
  type FinalEvent,
} from '@/lib/api/oath-engine';
import {
  getPreferences,
  setPreferences,
} from '@/lib/storage/preferences';
import {
  getIntentText,
  getDefaultFirstAction,
} from '@/lib/helpers/onboarding-defaults';
import { dataUrlToFileUri } from '@/lib/audio/dataUrlToFile';

const STAGE_TEXT: Record<StageId, string> = {
  stage_0_validate: 'preparing...',
  stage_1_analyze: 'thinking through your ritual...',
  stage_2_generate: 'writing three versions...',
  stage_3_critique: 'scoring each one...',
  stage_4_select: 'picking the strongest...',
  stage_5_refine: 'refining the script...',
  stage_6_judge: 'judging quality...',
  stage_7_prosody: 'adding rhythm...',
  stage_8_synthesize: 'generating audio...',
  stage_9_music_bed: 'mixing the music bed...',
  stage_10_assemble: 'almost ready...',
  final: 'ready.',
  error: 'something went sideways.',
};

const STAGE_ORDER: StageId[] = [
  'stage_0_validate',
  'stage_1_analyze',
  'stage_2_generate',
  'stage_3_critique',
  'stage_4_select',
  'stage_5_refine',
  'stage_6_judge',
  'stage_7_prosody',
  'stage_8_synthesize',
  'stage_9_music_bed',
  'stage_10_assemble',
];

interface TraceEntry {
  stage: StageId;
  status: StageEvent['status'];
  elapsedMs?: number;
}

// React Native's fetch buffers the full response before our parser sees
// any events (see lib/api/oath-engine.ts for why). To keep the UI feeling
// alive during the ~27s engine run, we tick a fake stage every
// FAKE_TICK_MS so the user sees stages advance even though the network
// payload only arrives at the end. When the real final event lands, we
// snap to "ready." and route — fake catches the real instantly.
const FAKE_TICK_MS = 2700; // 10 stages * 2.7s ≈ engine's 27s

type Phase = 'running' | 'complete' | 'error';

export default function Generating() {
  const [phase, setPhase] = useState<Phase>('running');
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [showTrace, setShowTrace] = useState(false);
  const [error, setError] = useState<PipelineError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Wall-clock tick for the "stage X · Ys" caption
  useEffect(() => {
    if (phase !== 'running') return;
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, [phase]);

  // Fake stage advancement — drives the visible stage text/index while we
  // wait for the engine to finish.
  useEffect(() => {
    if (phase !== 'running') return;
    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => Math.min(prev + 1, STAGE_ORDER.length - 1));
    }, FAKE_TICK_MS);
    return () => clearInterval(interval);
  }, [phase]);

  const stageText =
    phase === 'complete'
      ? STAGE_TEXT.final
      : STAGE_TEXT[STAGE_ORDER[currentStageIdx]] ?? STAGE_TEXT.stage_0_validate;

  const runPipeline = useCallback(async () => {
    setError(null);
    setPhase('running');
    setCurrentStageIdx(0);
    setTrace([]);
    setStartTime(Date.now());

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const prefs = await getPreferences();

      const req: PipelineInputs = {
        mode: prefs.defaultMode,
        intent: getIntentText(prefs.defaultMode),
        first_action: getDefaultFirstAction(prefs.defaultMode),
        hero: prefs.hero || 'someone you respect',
        phrase: prefs.groundingPhrase || 'trust the work',
        variant: 'default',
        voice: prefs.voicePreset,
      };

      const stream = generateRitual(req, { signal: controller.signal });
      let final: FinalEvent | null = null;
      while (true) {
        const { done, value } = await stream.next();
        if (done) {
          final = (value ?? null) as FinalEvent | null;
          break;
        }
        const evt = value as StageEvent;
        // Trace records every real event but DOESN'T drive the visual stage
        // (the fake timer does). This means the trace can be inspected via
        // the "what's happening" expander to see real elapsed_ms per stage.
        setTrace((prev) => [
          ...prev,
          { stage: evt.stage, status: evt.status, elapsedMs: evt.elapsed_ms },
        ]);
      }

      if (!final) {
        throw new PipelineError(
          'pipeline finished without a final event',
          undefined,
          true,
        );
      }

      // Materialise the data URL to a cache file. We use the same file for
      // both the immediate /onboarding/first-ritual playback and the
      // pre-cached morning alarm at /alarm/ritual — same audio, two doors.
      let usableCachePath: string | null = null;
      try {
        if (final.audio_url.startsWith('data:')) {
          const filename = `next-ritual-${Date.now()}.mp3`;
          usableCachePath = await dataUrlToFileUri(final.audio_url, filename);
        }
      } catch (err) {
        console.warn('failed to cache ritual audio file', err);
        usableCachePath = null;
      }

      await setPreferences({
        firstRitualAudioUrl: usableCachePath ?? final.audio_url,
        firstRitualScript: final.script,
        firstRitualVoice: req.voice ?? 'the_closer',
        firstRitualFinalScore: final.final_score,
        nextRitualPath: usableCachePath,
        nextRitualScript: final.script,
        nextRitualGeneratedAt: new Date().toISOString(),
        nextRitualVoice: req.voice ?? 'the_closer',
        nextRitualFirstAction: req.first_action,
        nextRitualFinalScore: final.final_score,
        hasOnboarded: true,
      });

      setPhase('complete');
      setCurrentStageIdx(STAGE_ORDER.length - 1);

      setTimeout(() => {
        router.replace('/onboarding/first-ritual');
      }, 500);
    } catch (err) {
      if (controller.signal.aborted) return;
      setPhase('error');
      if (err instanceof PipelineError) setError(err);
      else
        setError(
          new PipelineError(
            err instanceof Error ? err.message : String(err),
            undefined,
            true,
          ),
        );
    }
  }, []);

  useEffect(() => {
    runPipeline();
    return () => {
      abortRef.current?.abort();
    };
  }, [runPipeline]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    runPipeline();
  };

  const handleSkipWithFallback = async () => {
    await setPreferences({
      firstRitualAudioUrl: null,
      firstRitualScript: null,
      firstRitualVoice: null,
      firstRitualFinalScore: null,
      hasOnboarded: true,
    });
    router.replace('/onboarding/first-ritual');
  };

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const visibleStage = Math.min(currentStageIdx + 1, STAGE_ORDER.length);

  if (error) {
    return (
      <ErrorState
        error={error}
        retryCount={retryCount}
        onRetry={handleRetry}
        onSkip={handleSkipWithFallback}
      />
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}
    >
      <View
        style={{
          paddingTop: spacing[4],
          paddingHorizontal: spacing[6],
          alignItems: 'center',
        }}
      >
        <Text variant="caption" color={colors.fg.muted}>
          FINAL STEP
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
        <GeneratingCircle stageIdx={currentStageIdx} />

        <View
          style={{
            marginTop: spacing[8],
            gap: spacing[2],
            alignItems: 'center',
          }}
        >
          <Text
            variant="h2"
            color={colors.fg.DEFAULT}
            style={{ textAlign: 'center' }}
          >
            {stageText}
          </Text>
          <Text
            variant="caption"
            color={colors.fg.muted}
            style={{ textAlign: 'center' }}
          >
            {`stage ${visibleStage} of ${STAGE_ORDER.length} · ${elapsedSec}s`}
          </Text>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: spacing[6],
          paddingBottom: spacing[6],
        }}
      >
        <Pressable
          onPress={() => setShowTrace((v) => !v)}
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[1],
            paddingVertical: spacing[2],
          }}
        >
          <Text variant="bodySm" color={colors.fg.subtle}>
            what&apos;s happening
          </Text>
          {showTrace ? (
            <ChevronUp color={colors.fg.subtle} size={14} />
          ) : (
            <ChevronDown color={colors.fg.subtle} size={14} />
          )}
        </Pressable>

        {showTrace ? (
          <ScrollView
            style={{ maxHeight: 160, marginTop: spacing[2] }}
            contentContainerStyle={{ paddingBottom: spacing[2] }}
          >
            {trace.map((entry, idx) => (
              <Text
                key={`${entry.stage}-${idx}`}
                variant="caption"
                color={colors.fg.subtle}
                style={{ fontFamily: fonts.mono, textTransform: 'none' }}
              >
                {`${entry.stage} · ${entry.status}${entry.elapsedMs ? ` · ${entry.elapsedMs}ms` : ''}`}
              </Text>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function GeneratingCircle({ stageIdx }: { stageIdx: number }) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0.4);
  const shadow = useSharedValue(0.3);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withTiming(0.9, {
        duration: 750,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true,
    );
    shadow.value = withRepeat(
      withTiming(0.6, {
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(rotation);
      cancelAnimation(pulse);
      cancelAnimation(shadow);
    };
  }, [rotation, pulse, shadow]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadow.value,
  }));

  const intensity = Math.min(1, stageIdx / 8);
  const innerSize = 56 + intensity * 28;

  return (
    <Animated.View
      style={[
        {
          width: 200,
          height: 200,
          borderRadius: 100,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.amber.DEFAULT,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 32,
        },
        shadowStyle,
      ]}
    >
      <Animated.View
        style={[
          {
            width: 200,
            height: 200,
            borderRadius: 100,
            borderWidth: 1,
            borderColor: colors.amber.DEFAULT,
            position: 'absolute',
          },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: colors.amber.bright,
          },
          pulseStyle,
        ]}
      />
    </Animated.View>
  );
}

interface ErrorStateProps {
  error: PipelineError;
  retryCount: number;
  onRetry: () => void;
  onSkip: () => void;
}

function ErrorState({ error, retryCount, onRetry, onSkip }: ErrorStateProps) {
  const canRetry = error.retryable && retryCount < 2;
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing[6],
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[3],
        }}
      >
        <Text variant="caption" color={colors.error}>
          {canRetry ? 'GIVE IT ANOTHER GO' : 'TRY AGAIN LATER'}
        </Text>
        <Text
          variant="h2"
          color={colors.fg.DEFAULT}
          style={{ textAlign: 'center' }}
        >
          ritual generation hit a snag
        </Text>
        <Text
          variant="body"
          color={colors.fg.muted}
          style={{ textAlign: 'center' }}
        >
          {error.message}
          {'\n\n'}
          {canRetry
            ? 'sometimes the engine takes a breath. try one more time.'
            : 'we’ll keep your inputs. continue with a sample ritual for now.'}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[8],
          gap: spacing[3],
        }}
      >
        {canRetry ? <Button label="try again" onPress={onRetry} /> : null}
        <Button
          label={canRetry ? 'use a sample ritual' : 'continue with sample'}
          variant="secondary"
          onPress={onSkip}
        />
      </View>
    </SafeAreaView>
  );
}
