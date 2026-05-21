# OATH iOS

The native iOS app for OATH. Calls the existing v2 pipeline at
[web-ten-sand-37.vercel.app/api/generate](https://web-ten-sand-37.vercel.app)
over SSE — no engine code in the mobile app.

## Stack

- Expo SDK 54.0.33 (managed workflow)
- React Native 0.81.5 + React 19.1.0 + TypeScript 5.9
- Expo Router (file-based navigation)
- NativeWind v4 + Tailwind CSS v3.4.x
- expo-audio (NOT expo-av — removed in SDK 55+)
- expo-notifications, expo-font, expo-secure-store, expo-router
- react-native-reanimated v4 + react-native-gesture-handler

Full reasoning in [docs/01-stack.md](docs/01-stack.md).

## Run locally

```bash
cd ios
npm install --legacy-peer-deps
npx expo start
```

Press `i` to open in iOS Simulator. Requires Xcode installed on Mac.

The `--legacy-peer-deps` flag is needed because of a benign peer-dep
warning between `react@19.1.0` and a transitive `react-dom@19.2.6` that
Expo Router pulls in. The mismatch does not affect native iOS builds
(react-dom is only used on web, which we don't support).

## Build for TestFlight

```bash
# Once: install EAS CLI and log in
npm install -g eas-cli
eas login

# Internal build (Simulator-only, for dev review)
eas build --platform ios --profile preview

# Production build for TestFlight
eas build --platform ios --profile production

# Push the latest production build to TestFlight
eas submit --platform ios --latest
```

## Setup checklist — blockers Kartik needs to resolve before prompt 2 ships to TestFlight

- [ ] **Apple Developer Program enrolment**, Deep24 organization. Kartik
      needs to be added as a developer under the Deep24 Apple team so the
      `com.deep24.oath` bundle ID can be provisioned.
- [ ] **App Store Connect app created** with bundle ID `com.deep24.oath`.
      Note the `ascAppId` from App Store Connect and add to
      [eas.json](eas.json) under `submit.production.ios.ascAppId`.
- [ ] **Apple Team ID** — find on developer.apple.com under
      Membership Details. Add to [eas.json](eas.json) under
      `submit.production.ios.appleTeamId`.
- [ ] **Signing credentials** — run `eas credentials` after the Apple
      account is set up to provision distribution certs and provisioning
      profiles. EAS handles this; you just need to be logged in.
- [ ] **Geist fonts** — download
      [Geist Sans + Geist Mono from vercel.com/font/geist](https://vercel.com/font/geist)
      and drop these six files into [assets/fonts/](assets/fonts/):
      - `Geist-Regular.ttf`
      - `Geist-Medium.ttf`
      - `Geist-SemiBold.ttf`
      - `Geist-Bold.ttf`
      - `GeistMono-Regular.ttf`
      - `GeistMono-Medium.ttf`

      Then uncomment the `FONT_MAP` entries in
      [lib/fonts/useGeistFonts.ts](lib/fonts/useGeistFonts.ts) and run
      `npx expo start --clear`. Until this is done, the app uses
      San Francisco (iOS system font) instead of Geist.
- [ ] **Critical Alerts entitlement** — optional, low odds of approval.
      Apply via developer portal so the alarm fires through Silent mode.
      See [docs/02-alarm-research.md](docs/02-alarm-research.md) section 2.2.

## Documentation

- [00 — Design research](docs/00-design-research.md) — visual references,
  motion philosophy, what to steal from Wayk / Headspace / Linear / Things 3
- [01 — Tech stack](docs/01-stack.md) — every dependency choice with the
  reasoning behind it
- [02 — Alarm + notifications research](docs/02-alarm-research.md) — the
  iOS 26 / AlarmKit landscape, what we ship in v0.1, what we upgrade to
  in v0.2

## Repo layout

```
ios/
├── app/                     # expo-router file-based routes
│   ├── _layout.tsx          # root layout (fonts, providers, status bar)
│   ├── index.tsx            # entry — redirects based on onboard/paywall state
│   ├── onboarding/
│   │   ├── _layout.tsx
│   │   └── index.tsx        # placeholder (built in prompt 2)
│   ├── alarm/
│   │   ├── _layout.tsx
│   │   └── ritual.tsx       # placeholder (built in prompt 3)
│   ├── paywall.tsx          # placeholder (built in prompt 2)
│   └── (tabs)/
│       ├── _layout.tsx      # tab bar
│       ├── home.tsx         # placeholder
│       ├── library.tsx      # placeholder
│       └── settings.tsx     # placeholder
├── components/
│   └── primitives/          # Box, Text, Button, Input, Card, AudioPlayer
├── lib/
│   ├── api/oath-engine.ts   # SSE client for the v2 pipeline
│   ├── design-system/       # tokens — colors, typography, spacing, motion
│   ├── fonts/useGeistFonts.ts
│   └── storage/preferences.ts
├── assets/
│   ├── fonts/               # ← Geist TTF files go here (blocker)
│   ├── icon.png             # app icon (default; replace before TestFlight)
│   └── splash-icon.png      # splash (default; replace before TestFlight)
├── docs/                    # locked design + stack + alarm research
├── app.config.ts            # Expo runtime config
├── eas.json                 # EAS Build + Submit pipeline
├── babel.config.js          # NativeWind + Reanimated
├── metro.config.js          # NativeWind CSS input wiring
├── tailwind.config.js       # design tokens mirrored for utility classes
└── global.css               # tailwind directives
```

## Environment

The app calls the public Vercel endpoint by default. Override locally:

```bash
EXPO_PUBLIC_API_BASE=http://localhost:3000 npx expo start
```

(Use this when running the web app locally and want the iOS dev client
to talk to it.)
