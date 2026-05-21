import * as Notifications from 'expo-notifications';

const ALARM_CATEGORY = 'oath-alarm';
const DAILY_ID = 'oath-daily-alarm';
const TEST_ID = 'oath-test-alarm';

let categoryConfigured = false;

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function setupAlarmCategory(): Promise<void> {
  if (categoryConfigured) return;
  try {
    await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY, [
      {
        identifier: 'open-ritual',
        buttonTitle: 'open ritual',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
    categoryConfigured = true;
  } catch (err) {
    console.warn('setupAlarmCategory failed', err);
  }
}

function parseAlarmTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map((s) => parseInt(s, 10));
  return { hour: h || 0, minute: m || 0 };
}

export interface AlarmNotificationData extends Record<string, unknown> {
  type: 'alarm-fire';
  scheduled_at: string;
  is_test?: boolean;
}

export async function scheduleDailyAlarm(alarmTime: string): Promise<string> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});

  const { hour, minute } = parseAlarmTime(alarmTime);
  const data: AlarmNotificationData = {
    type: 'alarm-fire',
    scheduled_at: new Date().toISOString(),
  };

  return Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: 'OATH',
      body: 'time to start. tap to play your ritual.',
      categoryIdentifier: ALARM_CATEGORY,
      // TODO(prompt-4): swap to the bundled 'oath-tone.caf' once we bundle one
      // via expo-build-properties or a config plugin. iOS's notification sound
      // path needs the file inside the app bundle; the system default works
      // fine for v0.1 TestFlight.
      sound: 'default',
      data,
      interruptionLevel: 'timeSensitive',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function scheduleTestAlarm(
  secondsFromNow: number = 30,
): Promise<string> {
  await Notifications.cancelScheduledNotificationAsync(TEST_ID).catch(() => {});

  const data: AlarmNotificationData = {
    type: 'alarm-fire',
    scheduled_at: new Date().toISOString(),
    is_test: true,
  };

  return Notifications.scheduleNotificationAsync({
    identifier: TEST_ID,
    content: {
      title: 'OATH',
      body: 'test alarm — tap to play ritual.',
      categoryIdentifier: ALARM_CATEGORY,
      sound: 'default',
      data,
      interruptionLevel: 'timeSensitive',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, secondsFromNow),
      repeats: false,
    },
  });
}

export async function cancelDailyAlarm(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
}

export async function cancelAllAlarms(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

export async function listScheduledAlarms() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.filter(
    (n) =>
      (n.content.data as AlarmNotificationData | undefined)?.type ===
      'alarm-fire',
  );
}

export function isAlarmFireResponse(
  response: Notifications.NotificationResponse | null | undefined,
): boolean {
  const data = response?.notification?.request?.content?.data as
    | AlarmNotificationData
    | undefined;
  return data?.type === 'alarm-fire';
}
