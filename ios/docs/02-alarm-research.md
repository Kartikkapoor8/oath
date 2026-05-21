# 02 — Alarm + iOS notification research

**Date:** 2026-05-20
**Author:** Kartik Kapoor (with Claude Code)
**Status:** Locked recommendation for v0.1; v0.2 path documented separately

This is the technical-feasibility doc behind one specific question Oliver
asked at the May 20 meeting: *can the iOS app actually wake the user up
and play a 45-90 second generated pep talk?*

The short answer is **yes, via a two-step pattern: a local notification
fires the alarm, the user taps the notification, the app foregrounds, and
the app plays the in-app pre-generated audio.** AlarmKit (the iOS-26
system-level alarm API now open to third-party apps) is a better long-
term solution but is deferred to v0.2.

This document is the long answer.

---

## 1. What we actually need

For the morning ritual, we need three things in order:

1. **Reliable wake** — at the user's chosen alarm time, the device must
   present something noticeable enough to wake the user even if the phone
   is in Silent mode or Do-Not-Disturb / Focus is enabled.
2. **One-tap entry** — when the user dismisses the alarm, the OATH app
   must come to the foreground.
3. **Full 45-90s pep talk playback** — once foregrounded, the app plays
   the pre-generated audio (data URL stored in AsyncStorage after last
   night's intent capture).

The hard part is #1 + #2. Once we have foreground, #3 is just `expo-audio`.

---

## 2. The iOS landscape in May 2026

There are three categories of API:

### 2.1 Local notifications via `expo-notifications` (UNUserNotificationCenter)

- **Available in v0.1.** Standard, well-supported.
- Can schedule a notification to fire at an exact time (`Date`-trigger).
- Can include a custom sound (must be a `.wav`/`.caf`/`.aiff` bundled in
  the app, ≤30s — anything longer falls back to default).
- Plays through the device's notification volume channel, **not** the
  media channel — silent mode silences it unless user enables Critical
  Alerts (special entitlement; see below).
- Tap behaviour: launches the app (cold start or foreground) and the
  notification payload is available via `Notifications.useLastNotificationResponse`.
- **Limitation:** if the user has Silent mode on, the notification is
  silent. The visual still appears on the lock screen. This is the same
  behaviour all third-party "alarm" apps had before iOS 26.
- [Expo notifications docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Apple — Local and Remote Notification Programming Guide](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/SupportingNotificationsinYourApp.html)

### 2.2 Critical Alerts entitlement (`com.apple.developer.usernotifications.critical-alerts`)

- Bypasses Silent and DND/Focus.
- **Requires Apple's explicit approval** via a form on the developer
  portal. Historically Apple grants this to medical, safety, and home-
  alert apps; almost never to lifestyle apps. We should not assume we'll
  get it.
- Applying is free and worth doing anyway; flag for Oliver.
- [Apple — Sending critical alerts](https://developer.apple.com/documentation/usernotifications)

### 2.3 AlarmKit (iOS 26+)

- **NEW in iOS 26 (released to public 2025-09; we are on iOS 26 by
  May 2026).** Apple opened AlarmKit to third-party apps at WWDC 2025.
- Gives developer apps the same alarm capability as Apple's Clock app:
  - Plays even in Silent mode
  - Plays even when Focus / DND is on
  - Full-screen system snooze / stop UI
  - Lock Screen + Dynamic Island + Apple Watch presentation
  - Unlimited alarms per app
- Native Swift API only. **Not** in core Expo. Community wrappers exist:
  - [expo-alarm-kit](https://github.com/nickdeupree/expo-alarm-kit) —
    Expo module, schedule alarms with app-launch-on-dismissal intents.
  - [react-native-nitro-ios-alarm-kit](https://github.com/Gautham495/react-native-nitro-ios-alarm-kit)
    — Nitro module, works in Expo + bare RN.
  - [rn-alarm-kit](https://github.com/wael-fadlallah/rn-alarm-kit) —
    React Native wrapper.
- All require a custom dev client (no Expo Go) and the modules are
  2 weeks – 2 months old (May 2026).
- [Apple — AlarmKit](https://developer.apple.com/documentation/AlarmKit)
- [iOS 26 makes third-party alarm apps better — MacRumors](https://www.macrumors.com/2025/06/11/ios-26-third-party-alarm-apps/)

---

## 3. Recommendation for v0.1 TestFlight (Friday May 22)

**Use category 2.1 — local notifications via `expo-notifications`.**

Three reasons:
1. It is the lowest-risk path to a working TestFlight build by Friday.
2. The app-side flow (foreground → play generated audio) is identical
   whether the wake signal is AlarmKit or a local notification. We can
   swap in AlarmKit later without touching the audio / ritual code.
3. Every competitor in this space (Wayk, Pepped, Dialed) was built
   before AlarmKit existed and still uses this pattern. It is the
   industry-standard approach for pre-iOS-26 — and most users haven't
   updated yet anyway.

**The known limitation:** if the user has Silent mode on and we don't
have the Critical Alerts entitlement, the alarm is silent. The fix is
either:
- Apply for Critical Alerts (low odds of approval, no harm in trying)
- Tell users in onboarding to keep ringer volume up overnight
- Add AlarmKit support in v0.2 (the real fix)

---

## 4. Concrete implementation pattern (v0.1)

Per the prompt brief, the realistic MVP flow Wayk / Dialed / Pepped all
use. The expo-notifications API calls needed:

### 4.1 Request permission once (onboarding finale)

```ts
import * as Notifications from 'expo-notifications';

async function ensureNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false,
      provideAppNotificationSettings: true,
    },
  });
  return req.granted;
}
```

### 4.2 Set the notification handler (foreground behaviour)

```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

### 4.3 Schedule the alarm

```ts
async function scheduleAlarm(alarmTime: { hour: number; minute: number }) {
  // Cancel any existing alarms so we never double-fire
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'OATH',
      body: "Today's pep talk is ready.",
      sound: 'oath-tone.caf', // bundled, ≤30s
      data: { type: 'morning-alarm' },
      interruptionLevel: 'timeSensitive',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: alarmTime.hour,
      minute: alarmTime.minute,
    },
  });
}
```

`interruptionLevel: 'timeSensitive'` is the next best thing to Critical
Alerts — it punches through some Focus modes (the user can configure
their Focus to allow our app's time-sensitive notifications).

### 4.4 Handle the tap → play the pep talk

In `app/_layout.tsx` (the root layout):

```ts
const lastResponse = Notifications.useLastNotificationResponse();

useEffect(() => {
  if (lastResponse?.notification.request.content.data?.type === 'morning-alarm') {
    router.push('/alarm/ritual');
  }
}, [lastResponse]);
```

The `ritual.tsx` screen loads the pre-generated pep talk audio
(stored after intent capture the night before) and starts playback.

### 4.5 Bundled tone — `oath-tone.caf`

A 25-second amber-warmth tone we ship as an iOS bundle resource. To be
designed in prompt 5. For dev we use the system default sound.

### 4.6 Background audio entitlement

`UIBackgroundModes: ['audio', 'fetch', 'remote-notification']` is set in
`app.config.ts`. This lets audio continue playing if the user navigates
away during the pep talk (e.g., gets out of bed and walks to the kitchen
with the phone in pocket).

---

## 5. Fallback if even local notifications can't trigger our app

This shouldn't happen for our flow, but recording the options:

- **Background fetch (`expo-background-fetch`)** is unreliable on iOS —
  Apple decides the cadence. Not useful for alarm-timing.
- **Push notifications via APNs** would let us trigger the same UX
  remotely, useful if we ever want server-driven re-engagement. Doesn't
  help with the basic alarm flow; same `useLastNotificationResponse`
  pattern.
- **Background processing tasks** (`BGAppRefreshTask`) have a 30s
  budget; not enough for alarm UX.

In practice: local notifications + `useLastNotificationResponse` is the
correct primitive. We don't need a fallback.

---

## 6. v0.2 upgrade path — AlarmKit

When we have time (post-Friday, ideally for the v0.2 build the following
week), the upgrade is:

1. Pick the most-stable community module — currently
   `react-native-nitro-ios-alarm-kit` looks best maintained, but verify
   2 weeks before adoption.
2. Apply the module's config plugin in `app.config.ts`.
3. Replace the `scheduleAlarm` body — same signature, different
   underlying API. The notification-tap path stays identical.
4. Test the Silent-mode and Focus-mode bypass on a real device.
5. Ship to TestFlight as v0.2.

Because the app-side flow is identical (notification → foreground →
play), this is a true drop-in. The risk is only in the native module
itself, not the user-facing UX.

---

## 7. What we are explicitly NOT promising users

- We are NOT a 100% reliable medical-grade wake-up service. If you must
  wake at a specific time (e.g., for a flight), use Apple's Clock app or
  a dedicated AlarmKit-using app with Critical Alerts.
- We are NOT bypass-Silent-mode in v0.1. We document this in onboarding.
- We are NOT cross-device sync. The alarm is local to the device.

---

## 8. Code sketch — full alarm scheduling module (target file: `ios/lib/alarms/scheduler.ts`, prompt 2)

```ts
import * as Notifications from 'expo-notifications';

export interface AlarmConfig {
  hour: number;   // 0-23
  minute: number; // 0-59
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: true,
      allowBadge: false,
      allowDisplayInCarPlay: false,
      allowCriticalAlerts: false,
    },
  });
  return req.granted;
}

export async function scheduleDailyAlarm(time: AlarmConfig): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'OATH',
      body: "Today's pep talk is ready.",
      data: { type: 'morning-alarm' },
      interruptionLevel: 'timeSensitive',
      sound: 'oath-tone.caf',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
    },
  });
}

export async function clearAlarm(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
```

---

## 9. References

- [Apple — AlarmKit](https://developer.apple.com/documentation/AlarmKit)
- [iOS 26 makes third-party alarm apps better — MacRumors (2025-06-11)](https://www.macrumors.com/2025/06/11/ios-26-third-party-alarm-apps/)
- [Expo — Notifications API](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Apple — Sending critical alerts](https://developer.apple.com/documentation/usernotifications)
- [expo-alarm-kit (community module)](https://github.com/nickdeupree/expo-alarm-kit)
- [react-native-nitro-ios-alarm-kit (community module)](https://github.com/Gautham495/react-native-nitro-ios-alarm-kit)
- [Apple Developer Forum — Custom local notification sound duration limits](https://developer.apple.com/forums/thread/66925)

---
