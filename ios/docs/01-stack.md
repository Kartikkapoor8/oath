# 01 — Tech stack

**Date:** 2026-05-20
**Author:** Kartik Kapoor (with Claude Code)
**Status:** Locked for prompt 2 — change requires sign-off

The OATH iOS app stack. Every dependency below is pinned for the v0.1
TestFlight build. Versions reflect what `create-expo-app@latest` resolved
to on 2026-05-20 (Expo SDK 54.0.33 — the current stable major; SDK 56 is in
beta as of this date).

---

## Platform versions

| Tool | Version | Notes |
|---|---|---|
| Node | v24.2.0 | local dev machine |
| npm | 11.3.0 | |
| Expo SDK | 54.0.33 | `@latest` on npm at scaffold time |
| React Native | 0.81.5 | bundled with Expo SDK 54 |
| React | 19.1.0 | bundled with Expo SDK 54 |
| TypeScript | 5.9.2 | |

iOS-only target. `app.config.ts` has no `android` block.
Bundle identifier: `com.deep24.oath`.

---

## Decisions and the reasoning behind them

### Navigation — Expo Router (file-based)

**Choice:** `expo-router@~6.0.23`.
**Alternative considered:** React Navigation (the lower-level library
Expo Router wraps).
**Why:** File-based routing matches the existing Vercel web app's mental
model (Next.js `app/` directory). Less navigation config to maintain. Typed
routes generate at `npx expo start` and survive refactors. Deep linking
comes free, which we need for share-out cards in v0.2.
**Smallest risk:** Expo Router is an opinionated abstraction; if we ever
need a custom transition that Stack/Tabs can't express, we drop to
React Navigation's primitives via Expo Router's escape hatch.

### Styling — NativeWind v4 + Tailwind CSS v3.4.17

**Choice:** `nativewind@^4` paired with `tailwindcss@^3.4.17`.
**Alternative considered:** styled-components, plain StyleSheet,
unistyles.
**Why:** Mirrors the web demo's Tailwind v4 setup as closely as React
Native allows. Lets us share the design-token vocabulary
(`bg-bg-raised`, `text-amber`, `font-display`) between iOS and web.
**Smallest risk:** NativeWind v4 specifically requires Tailwind v3 — v4
is not supported yet (NativeWind v5 is in preview as of May 2026). We
pin to `tailwindcss@^3.4.17` to avoid accidental v4 upgrade.
**Source:** [NativeWind installation docs](https://www.nativewind.dev/docs/getting-started/installation)

### State management — React Context + `useReducer`

**Choice:** Native React only.
**Alternatives considered:** Zustand, Jotai, Redux Toolkit, MobX.
**Why:** MVP state is small — user preferences, current pep-talk-being-
generated, and audio player state. None of this benefits from a store
library. We will revisit if the state graph grows.

### Storage — AsyncStorage (preferences) + SecureStore (architecture-ready)

**Choice:** `@react-native-async-storage/async-storage@2.2.0` for user
prefs (hero, grounding phrase, alarm time, onboarding flags).
`expo-secure-store@~15.0.8` is installed but unused in v0.1; we keep it
so the migration cost is zero when we add a real auth/account.
**Why:** AsyncStorage is the React Native idiomatic local-pref store.
Encrypted via iOS Keychain on the device anyway for the prefs domain.

### Audio playback — `expo-audio` (NOT `expo-av`)

**Choice:** `expo-audio@~1.1.1`.
**This is a deviation from the original prompt brief.** The original
brief mentioned `expo-av` as the audio library. `expo-av` is **fully
removed from Expo SDK 55+** and replaced by two packages: `expo-video`
and `expo-audio`. SDK 54 still has `expo-av` available as a deprecated
package, but new code should not use it.
**Alternative considered:** `react-native-track-player` — more
batteries-included (background controls, lock-screen integration),
but heavier and we don't need its features in v0.1.
**Smallest risk:** `expo-audio` is the newer hook-based API and is
well-supported. Background audio will need
`UIBackgroundModes: ['audio']` in Info.plist (already set in
`app.config.ts`).
**Source:** [expo-audio docs](https://docs.expo.dev/versions/latest/sdk/audio/), [Expo SDK 55 migration: expo-av removed](https://expo.dev/changelog/sdk-55-beta)

### Local notifications — `expo-notifications`

**Choice:** `expo-notifications@~0.32.17`.
**Why:** Standard managed-workflow option for local notifications. Sufficient
for the alarm-fire pattern documented in `02-alarm-research.md` (notification
fires → user taps → app launches → app plays the full pep talk).
**Limitation we know about:** iOS local notifications can play a custom
sound only up to ~30 seconds, and only if the sound is bundled as a `.wav`
or `.caf` in the app build. We use a short bundled tone for the notification
sound and the actual generated pep talk plays in-app after launch.
**Smallest risk:** APNs (Apple Push Notification service) is required for
*remote* push but we are using *local* scheduled notifications, which works
without server infrastructure.
**Source:** [Expo notifications docs](https://docs.expo.dev/versions/latest/sdk/notifications/)

### System-level alarms — `AlarmKit` (deferred to v0.2)

**Choice for v0.1:** local notifications only.
**Choice we'll evaluate for v0.2:** wrap iOS 26's `AlarmKit` via a community
Expo module (`expo-alarm-kit`, `react-native-nitro-ios-alarm-kit`, or
similar). AlarmKit gives third-party apps the same wake-the-user-even-in-
Silent-mode behaviour as Apple's first-party Clock app, which is the only
remaining feature gap between OATH and an "alarm clock for real".
**Why deferred:** AlarmKit requires a custom development client (no Expo
Go), and the community wrappers are 0-2 months old as of May 2026. We do
not want any unknown native-module risk on the Friday TestFlight build.
The app-side flow is identical whether the wake-up signal is AlarmKit or
expo-notifications (user dismisses → app foregrounds → app plays generated
audio), so this is a true drop-in upgrade later.
**Source:** [Apple — Introducing AlarmKit (iOS 26)](https://developer.apple.com/documentation/AlarmKit), [iOS 26 makes third-party alarm apps better — MacRumors](https://www.macrumors.com/2025/06/11/ios-26-third-party-alarm-apps/)

### Network requests — native `fetch`

**Choice:** stock fetch + a small `generateRitual` async generator that
parses SSE events.
**Alternatives considered:** axios, react-query, swr.
**Why:** Single API call to a single endpoint. The Vercel SSE response is
easy to parse with a `TextDecoder`. Adding a data-fetching library here
buys nothing and adds bundle size.

### Animation — `react-native-reanimated@~4.1.1` + `react-native-gesture-handler@~2.28.0`

**Choice:** both are bundled with Expo (already installed).
**Why:** Reanimated v4 runs animations on the UI thread and is the
de-facto standard for any iOS-native-feeling interaction. Gesture handler
gives us proper iOS-style swipe-to-dismiss, drag-to-snooze, and pan
interactions.
**Smallest risk:** Reanimated v4 requires the `react-native-reanimated/plugin`
in `babel.config.js`. It must be the LAST plugin in the list. We've set that.

### Icons — `lucide-react-native`

**Choice:** `lucide-react-native` (paired with `react-native-svg` which it
needs).
**Why:** Matches the web demo's icon set (lucide-react). Identical glyph
shapes across platforms. Tree-shakeable.
**Alternative considered:** `@expo/vector-icons` (which wraps a bunch of
icon families). Heavier and the visual style doesn't match the web app.

### Fonts — `expo-font` with Geist Sans + Geist Mono

**Choice:** Geist family loaded as TTF files from `assets/fonts/`.
**Why:** Matches the web demo exactly.
**Files needed in `assets/fonts/`:**
- `Geist-Regular.ttf`
- `Geist-Medium.ttf`
- `Geist-SemiBold.ttf`
- `Geist-Bold.ttf`
- `GeistMono-Regular.ttf`
- `GeistMono-Medium.ttf`

**Blocker for Kartik:** these TTF files are not yet in the repo. Download
from [vercel.com/font/geist](https://vercel.com/font/geist) and drop
into `ios/assets/fonts/` before the first dev-client build. Until then
the app falls back to the system font (San Francisco), which is fine for
local development but not for TestFlight.

### Build pipeline — EAS Build + EAS Submit

**Choice:** Expo Application Services.
**Why:** Standard managed-workflow path. No local Xcode signing required.
Free tier is sufficient for our build cadence (10-15 builds/month).
**Workflow:**
1. `eas build --platform ios --profile preview` for internal dev builds
2. `eas build --platform ios --profile production` for TestFlight
3. `eas submit --platform ios --latest` to push the build to App Store
   Connect TestFlight
**Smallest risk:** initial signing requires Apple Developer Program
enrollment under the Deep24 organisation. See README "Setup checklist".

### Linting / formatting

**Choice for v0.1:** none beyond TypeScript's strict mode and
`prettier-plugin-tailwindcss` to keep class lists ordered.
**Why:** we don't have time to bikeshed ESLint configs before Friday.
Add when the team grows beyond Kartik.

---

## What is explicitly NOT in the stack

These libraries were *considered and rejected* — recording so we don't
re-relitigate the decision:

- **Redux / Redux Toolkit** — overkill for current state.
- **Zustand / Jotai** — same.
- **`react-query` / TanStack Query** — one endpoint, no cache invalidation
  story needed yet.
- **`axios`** — fetch is fine.
- **`@react-navigation/native` directly** — Expo Router wraps it.
- **`react-native-track-player`** — heavier than expo-audio; revisit if we
  need lock-screen audio controls.
- **`react-native-mmkv`** — faster than AsyncStorage but we don't have a
  perf problem yet.
- **`react-native-svg-transformer`** — we use Lucide for icons, not custom
  SVG components.
- **Storybook** — defer until prompt 4+ if we want to isolate component
  reviews.

---

## Versions snapshot (regenerable via `npm ls`)

Locked dependencies from `ios/package.json` at scaffold time:

```
"dependencies": {
  "@react-native-async-storage/async-storage": "2.2.0",
  "expo": "~54.0.33",
  "expo-audio": "~1.1.1",
  "expo-constants": "~18.0.13",
  "expo-font": "~14.0.11",
  "expo-linking": "~8.0.12",
  "expo-notifications": "~0.32.17",
  "expo-router": "~6.0.23",
  "expo-secure-store": "~15.0.8",
  "expo-splash-screen": "~31.0.13",
  "expo-status-bar": "~3.0.9",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "lucide-react-native": "^x.y.z",
  "react-native-svg": "^x.y.z"
},
"devDependencies": {
  "@types/react": "~19.1.0",
  "nativewind": "^4.x",
  "prettier-plugin-tailwindcss": "^x.y.z",
  "tailwindcss": "^3.4.17",
  "typescript": "~5.9.2"
}
```

Run `npm ls --depth=0 --json` inside `ios/` to regenerate the exact tree.

---
