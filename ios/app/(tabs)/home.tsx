import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { AlarmClock, MoonStar, Zap, Pencil } from 'lucide-react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Button, Card, Text } from '@/components/primitives';
import { colors, fonts, radius, spacing } from '@/lib/design-system';
import {
  getPreferences,
  setPreferences,
  type UserPreferences,
} from '@/lib/storage/preferences';
import {
  firstName,
  formatAlarmTime12h,
  formatDateCaption,
  modeLabel,
  timeOfDayGreeting,
  voiceLabel,
} from '@/lib/helpers/onboarding-defaults';
import {
  getPreGenStatus,
  preGenerateNextRitual,
  subscribePreGen,
  type PreGenStatus,
} from '@/lib/rituals/pre-generation';
import { scheduleDailyAlarm, scheduleTestAlarm } from '@/lib/alarms/scheduler';

function parseAlarm(time: string | null): Date {
  const d = new Date();
  if (!time) {
    d.setHours(6, 0, 0, 0);
    return d;
  }
  const [hStr, mStr] = time.split(':');
  d.setHours(parseInt(hStr, 10) || 6, parseInt(mStr, 10) || 0, 0, 0);
  return d;
}

function format24h(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function Home() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [preGenStatus, setPreGenStatus] = useState<PreGenStatus>(
    getPreGenStatus(),
  );
  const [timeEditOpen, setTimeEditOpen] = useState(false);
  const [pendingAlarm, setPendingAlarm] = useState<Date>(parseAlarm(null));
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    const p = await getPreferences();
    setPrefs(p);
    setPendingAlarm(parseAlarm(p.alarmTime));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
    const unsub = subscribePreGen((s) => {
      setPreGenStatus(s);
      if (s === 'success') load();
    });
    return unsub;
  }, [load]);

  if (!prefs) {
    return <View style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }} />;
  }

  const greeting = `${timeOfDayGreeting()}${
    prefs.hero ? `, ${firstName(prefs.hero).toLowerCase()}` : ''
  }`;

  const ritualBadge = computeRitualBadge(prefs, preGenStatus);

  const handleSaveTime = async (_: DateTimePickerEvent, picked?: Date) => {
    if (!picked) return;
    setPendingAlarm(picked);
  };

  const commitTime = async () => {
    const next = format24h(pendingAlarm);
    await setPreferences({ alarmTime: next });
    if (prefs.notificationsPermission === 'granted') {
      try {
        await scheduleDailyAlarm(next);
      } catch (err) {
        console.warn('reschedule failed', err);
      }
    }
    setTimeEditOpen(false);
    load();
  };

  const handleFireTestAlarm = async () => {
    try {
      await scheduleTestAlarm(30);
      setTestFeedback('test alarm fires in 30s — background the app');
    } catch (err) {
      setTestFeedback('failed to schedule — check notification permissions');
    }
    setTimeout(() => setTestFeedback(null), 6000);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: spacing[4],
          paddingBottom: spacing[10],
          gap: spacing[4],
        }}
      >
        <View style={{ gap: spacing[2] }}>
          <Text variant="caption" color={colors.fg.muted}>
            {formatDateCaption()}
          </Text>
          <Text variant="display" color={colors.fg.DEFAULT}>
            {greeting}
          </Text>
        </View>

        <Card
          padding={6}
          style={{
            borderLeftWidth: 4,
            borderLeftColor: colors.amber.DEFAULT,
            borderColor: colors.border.subtle,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[3],
              }}
            >
              <AlarmClock
                color={colors.amber.DEFAULT}
                size={24}
                strokeWidth={2}
              />
              <Text variant="h3" color={colors.fg.DEFAULT}>
                tomorrow&apos;s alarm
              </Text>
            </View>
            <Pressable
              onPress={() => setTimeEditOpen(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Edit alarm time"
            >
              <Pencil color={colors.fg.muted} size={18} />
            </Pressable>
          </View>

          <Text
            color={colors.fg.DEFAULT}
            style={{
              fontFamily: fonts.display,
              fontSize: 44,
              lineHeight: 48,
              letterSpacing: -1.2,
              marginTop: spacing[4],
            }}
          >
            {formatAlarmTime12h(prefs.alarmTime)}
          </Text>

          <View style={{ marginTop: spacing[4], gap: spacing[2] }}>
            <Text variant="body" color={colors.fg.muted}>
              {`ritual: ${modeLabel(prefs.defaultMode)}`}
            </Text>
            <Text variant="body" color={colors.fg.muted}>
              {`voice: ${voiceLabel(prefs.voicePreset)}`}
            </Text>
          </View>

          {ritualBadge ? (
            <View
              style={{
                marginTop: spacing[4],
                flexDirection: 'row',
                gap: spacing[2],
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: ritualBadge.color,
                }}
              />
              <Text variant="caption" color={ritualBadge.color}>
                {ritualBadge.label}
              </Text>
            </View>
          ) : null}

          {prefs.notificationsPermission !== 'granted' ? (
            <Text
              variant="caption"
              color={colors.error}
              style={{ marginTop: spacing[3] }}
            >
              NOTIFICATIONS OFF · ALARM WILL NOT FIRE
            </Text>
          ) : null}
        </Card>

        <Pressable
          onPress={() => router.push('/modals/intent-capture')}
          accessibilityRole="button"
          accessibilityLabel="Edit tonight's commitment"
        >
          <Card padding={5}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[3],
              }}
            >
              <MoonStar
                color={colors.amber.DEFAULT}
                size={20}
                strokeWidth={2}
              />
              <Text variant="h3" color={colors.fg.DEFAULT}>
                tonight&apos;s commitment
              </Text>
            </View>
            {prefs.tomorrowFirstAction ? (
              <View style={{ marginTop: spacing[3], gap: spacing[1] }}>
                <Text variant="body" color={colors.fg.DEFAULT}>
                  {prefs.tomorrowFirstAction}
                </Text>
                <Text variant="caption" color={colors.fg.subtle}>
                  tap to edit
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: spacing[3], gap: spacing[1] }}>
                <Text
                  variant="body"
                  color={colors.fg.muted}
                  style={{ fontStyle: 'italic' }}
                >
                  what&apos;s tomorrow&apos;s commitment?
                </Text>
                <Text variant="caption" color={colors.fg.subtle}>
                  tap to set
                </Text>
              </View>
            )}
          </Card>
        </Pressable>

        <Card
          padding={5}
          style={{
            borderStyle: 'dashed',
            borderColor: colors.border.medium,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[3],
            }}
          >
            <Zap color={colors.fg.muted} size={20} strokeWidth={2} />
            <Text variant="h3" color={colors.fg.muted}>
              test alarm
            </Text>
          </View>
          <Text
            variant="bodySm"
            color={colors.fg.subtle}
            style={{ marginTop: spacing[2] }}
          >
            fires a notification in 30 seconds. background the app to see
            the lock-screen alert; tap to enter the ritual.
          </Text>
          <View style={{ marginTop: spacing[3] }}>
            <Button
              label="fire test alarm"
              variant="secondary"
              onPress={handleFireTestAlarm}
            />
          </View>
          {testFeedback ? (
            <Text
              variant="caption"
              color={colors.amber.bright}
              style={{ marginTop: spacing[3] }}
            >
              {testFeedback}
            </Text>
          ) : null}
        </Card>

        <View style={{ gap: spacing[3], marginTop: spacing[2] }}>
          <Text variant="caption" color={colors.fg.muted}>
            RECENT RITUALS
          </Text>
          <Card padding={5}>
            {prefs.lastRitualCompletedAt ? (
              <View style={{ gap: spacing[1] }}>
                <Text variant="body" color={colors.fg.DEFAULT}>
                  last ritual completed
                </Text>
                <Text variant="caption" color={colors.fg.subtle}>
                  {new Date(prefs.lastRitualCompletedAt).toLocaleString()}
                </Text>
              </View>
            ) : (
              <Text variant="body" color={colors.fg.muted}>
                your first ritual is queued. you&apos;ll see your history
                here after tomorrow morning.
              </Text>
            )}
          </Card>
        </View>

        <View style={{ marginTop: spacing[4] }}>
          <Button
            label="generate a fresh ritual now"
            variant="ghost"
            onPress={() => preGenerateNextRitual()}
          />
        </View>
      </ScrollView>

      <Modal
        visible={timeEditOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTimeEditOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.7)',
          }}
        >
          <View
            style={{
              backgroundColor: colors.bg.elevated,
              borderTopLeftRadius: radius['3xl'],
              borderTopRightRadius: radius['3xl'],
              padding: spacing[6],
              gap: spacing[4],
            }}
          >
            <View style={{ gap: spacing[2] }}>
              <Text variant="caption" color={colors.fg.muted}>
                ALARM TIME
              </Text>
              <Text variant="h2" color={colors.fg.DEFAULT}>
                when do you wake up?
              </Text>
            </View>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={pendingAlarm}
                mode="time"
                display="spinner"
                onChange={handleSaveTime}
                themeVariant="dark"
                textColor={colors.fg.DEFAULT}
                minuteInterval={5}
                style={{ alignSelf: 'stretch' }}
              />
            ) : (
              <DateTimePicker
                value={pendingAlarm}
                mode="time"
                onChange={handleSaveTime}
              />
            )}
            <View style={{ gap: spacing[2] }}>
              <Button label="save" onPress={commitTime} />
              <Button
                label="cancel"
                variant="ghost"
                onPress={() => setTimeEditOpen(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function computeRitualBadge(
  prefs: UserPreferences,
  status: PreGenStatus,
): { label: string; color: string } | null {
  if (status === 'running') {
    return { label: 'GENERATING TOMORROW’S RITUAL...', color: colors.amber.bright };
  }
  if (status === 'error') {
    return { label: 'GENERATION FAILED · TAP TO RETRY', color: colors.error };
  }
  if (prefs.nextRitualPath) {
    return { label: 'RITUAL READY FOR ALARM', color: colors.success };
  }
  if (prefs.tomorrowFirstAction) {
    return { label: 'NO CACHED RITUAL · TAP TO REGENERATE', color: colors.warn };
  }
  return null;
}
