# 00 — Design research

**Date:** 2026-05-20
**Author:** Kartik Kapoor (with Claude Code)
**Status:** Locked for prompt 2 — change requires sign-off

This is the visual + interaction reference brief for the OATH iOS app. Every screen
we build in subsequent prompts should be checkable against this document. The goal
is to feel like a real, premium iOS product on day one — not a generic React Native
app, and not a recoloured copy of the web demo at
https://web-ten-sand-37.vercel.app.

---

## 1. The product identity in one paragraph

OATH is a morning alarm ritual app. The dominant emotional state at the moment of
use is *being woken up* — eyes half-closed, room dark, attention low. The second
state is *generating tomorrow's pep talk* — the user is awake, choosing, about to
go to bed. The visual language must serve both: a dark, calm, "lit from inside"
surface that is legible at 6am on a face-down phone, with a single warm focal
colour (amber) that signals when something is happening or when the user should
look. No marketing gradients, no playful illustration, no glassy chrome for its
own sake.

---

## 2. Apps studied and what to take from each

### 2.1 Wayk (Dialed Labs Inc.) — the direct competitor

- 100k+ downloads, 4.78 stars on 10.8k reviews, viral on TikTok (25M views in
  30 days).
- Mission-based wake-up: push-ups, photo of the sky, scan a barcode in another
  room. You can't dismiss the alarm until the mission completes.
- Visual language: black/off-black background, large monospaced or condensed
  display numerals for the alarm time, soft pastel accent per mission category.
- The alarm-firing screen is full-bleed black with one large action — *every
  competitor in this space puts the dismissal in the bottom 30% of the screen so
  a sleepy thumb can reach it.* OATH must do the same.

**Steal:** unblockable-feeling alarm screen, mission-as-ritual framing, single
focal action in the lower third.
**Avoid:** the playful pastel palette; OATH's tone is heavier and quieter. Avoid
their habit-game language ("streaks!", "level up") — we are not a streak app, we
are a ritual app.

### 2.2 Dialed Calendar (the radial 24-hour calendar Oliver referenced)

- iOS-native, dark mode default, single bright accent ring on a near-black field.
- Uses generous negative space and tight typographic hierarchy — one display
  number, one supporting line, nothing else on the primary view.
- Spring physics for the radial rotation; nothing snaps.

**Steal:** the radial framing of time, the discipline of a single hero element
per screen.
**Avoid:** we are not a calendar; do not borrow the radial dial literally.

### 2.3 Pepped (the direct AI-pep-talk competitor)

- $2.99/wk, $6.99/mo, $39.99/yr; iOS-only, no account to start.
- Two-way conversational coach — they monetised the *chat* feature, not the
  audio. Their "Pep a Friend" card is the share-out moment.
- Visual: warm orange brand, much more chat-bubble UI than ritual UI. Reads more
  like Replika than like a morning alarm.

**Steal:** their pricing anchors ($6.99/mo is the price point users have already
accepted in this category). Their share-out card is a smart growth surface.
**Avoid:** the chat-bubble metaphor. OATH is audio-first; do not let text take
over the screen.

### 2.4 Headspace — the calm-wellness benchmark

- Sleep mode UI is a separate design discipline: very low contrast, larger touch
  targets, fewer affordances. *This is the exact mode OATH's alarm-fire screen
  needs to be in.*
- Brand orange (`#F47D31`-ish) sits on near-black. Cushioned, rounded geometry.
- Big custom illustration team; not a path we should copy.

**Steal:** the "sleep UI rules" — minimal contrast on the alarm screen, 56pt+
touch targets, no fine controls.
**Avoid:** the friendly illustration system; OATH's brand is harder.

### 2.5 Calm

- Dark UI with photographic backgrounds; we are *not* doing photographic
  backgrounds (too noisy, too generic).
- One useful pattern: the breathing-room countdown screen has nothing on it
  except a pulsing circle and a short instruction. This is a good shape for
  OATH's "generating your pep talk" screen.

**Steal:** the pulsing-circle "something is happening" pattern for the SSE
generation screen.
**Avoid:** stock photography, generic spa typography.

### 2.6 Linear — the gold standard for restrained dark UI

- `#08090A` to `#1C1D20` background scale. Inter / Inter Display font family.
- Almost no chrome; dividers are 1px `rgba(255,255,255,0.06)`. Every surface
  earns its presence.
- Motion philosophy: instant or near-instant on input, with a single 200–250ms
  ease-out for view transitions. Nothing bounces.

**Steal:** the entire background colour scale, the divider weight, the motion
philosophy ("snappy not springy").
**Avoid:** Linear's keyboard-heavy interaction model — irrelevant on iOS.

### 2.7 Things 3 (Cultured Code)

- Apple Design Award–winning iOS-native craftsmanship: spring animations on
  drag-and-drop, the "magic plus" button that lifts and travels, system-font
  typography (San Francisco), exact iOS HIG conformance.
- Lesson: *interaction details matter more than visual flourish.* Things 3
  looks plain in a screenshot; it feels expensive in 2 seconds of use.

**Steal:** the discipline of using `react-native-reanimated` for every
press/hover/dismiss interaction — never just opacity changes. Use spring
configs for anything physical (sheet dismissal, button presses), timing
configs for anything informational (fades, opacity).
**Avoid:** trying to ape Things 3's task-list patterns; we are not a list app.

### 2.8 Arc browser mobile

- Strong example of *futuristic + functional* — the colour washes, the gesture
  vocabulary, the way the URL bar redraws itself.
- Heavy use of glass / blur surfaces against richly coloured backdrops.

**Steal:** the idea that *the chrome itself moves and responds* — toolbar pulls
in when scrolling, search bar transforms when tapped. We can apply this to the
"tomorrow's pep talk" preview that lives on the home screen.
**Avoid:** the colour-pop accent backgrounds; we are amber-on-black, not
candy-colour.

### 2.9 One Sec (Frederik Riedel)

- Single-purpose pause app. The breathing screen is the entire UX: black
  background, large breathing animation, no UI chrome at all during the pause.
- Beautiful demonstration of "what to remove" instead of "what to add".

**Steal:** the alarm-fire screen should be a *One Sec moment* — no chrome, one
focal animation (the audio waveform), one large action (dismiss/snooze) at the
bottom. The user is half asleep; do not present them with options.
**Avoid:** literal breathing animation; that's their thing, not ours.

---

## 3. Locked design language

### 3.1 Colour

The web demo's palette is already correct. We adopt it verbatim with two iOS-
specific notes.

| Token | Hex | Use |
|---|---|---|
| `bg.DEFAULT` | `#0A0B0F` | Page background everywhere except modal sheets |
| `bg.raised` | `#13151B` | Cards, inputs, the alarm-time display tile |
| `bg.elevated` | `#1A1D26` | Modals, sheets, picker overlays |
| `bg.glass` | `rgba(19,21,27,0.8)` | iOS-style translucent overlays (use sparingly) |
| `fg.DEFAULT` | `#F5F5F7` | Primary text — matches Apple's system label colour in dark mode |
| `fg.muted` | `#9CA3AF` | Secondary text, body copy on dim screens |
| `fg.subtle` | `#6B7280` | Captions, metadata, "x seconds ago" labels |
| `fg.dim` | `#374151` | Disabled state, placeholder text |
| `amber.DEFAULT` | `#F59E0B` | Primary CTA background, focal hover/focus rings |
| `amber.bright` | `#FCD34D` | Pulsing-glow accents, the "play" indicator |
| `amber.dim` | `#B45309` | Captions above section headlines (the "lit dust" tone) |
| `amber.glow` | `rgba(245,158,11,0.15)` | Halo/glow under the playing audio button |
| `future.DEFAULT` | `#6366F1` | Roadmap-only color; do NOT use in current screens |
| `success` | `#10B981` | Generation complete state, pass states |
| `warn` | `#F59E0B` | Identical to amber by design — one warm signal channel |
| `error` | `#EF4444` | Failure / sync error state |

**iOS-specific notes:**
- Status bar is always `light-content` — set globally at root layout.
- We do NOT support light mode in v0.1. `app.config.ts` pins `userInterfaceStyle`
  to `dark`. This is a deliberate scope cut; revisit after TestFlight.
- Do not use Apple's system blue. The OATH "interactive" colour is amber.

### 3.2 Typography

We use Geist (the web demo's font) on mobile too, loaded via `expo-font` from
local TTF files. Geist Mono is the accent / caption font.

| Token | Size | Line height | Letter-spacing | Weight | Use |
|---|---|---|---|---|---|
| `displayXl` | 48 | 52 | -1.5 | 700 | Alarm time on alarm-fire screen |
| `display` | 36 | 40 | -1.0 | 700 | Onboarding hero phrase reveal |
| `h1` | 30 | 36 | -0.75 | 600 | Screen titles |
| `h2` | 24 | 30 | -0.5 | 600 | Section headers |
| `h3` | 20 | 26 | -0.25 | 600 | Card headers |
| `bodyLg` | 18 | 26 | 0 | 400 | Onboarding question prompts |
| `body` | 16 | 24 | 0 | 400 | Default body text |
| `bodySm` | 14 | 20 | 0 | 400 | Helper text |
| `caption` | 12 | 16 | 0.4 | 500 | Mono uppercase labels above headers |

`caption` is always Geist Mono, uppercase, `amber.dim` colour. This matches
the existing web demo's `.caption` class exactly.

### 3.3 Spacing — 4pt grid

```
0  1   2   3   4   5   6   8   10  12  16  20  24
0  4   8   12  16  20  24  32  40  48  64  80  96
```

Most of the app lives between `spacing.4` (16) and `spacing.6` (24). Cards
typically use `spacing.6` interior padding, screens use `spacing.5` (20)
horizontal padding to match iOS large-title screen margins.

### 3.4 Radius

```
sm: 4   md: 8   lg: 12   xl: 16   2xl: 20   3xl: 24   full: 9999
```

Default button radius: `xl` (16). Default card radius: `2xl` (20). Picker
sheets and modals: `3xl` (24) on top corners only. The alarm-time display
tile uses `2xl` for parity with iOS clock widgets.

### 3.5 Motion philosophy — "snappy, not springy"

We borrow from Linear: most transitions are 200–250ms `ease-out`. Things that
physically move (sheets, drag-to-dismiss) use a tight spring; things that
inform (fades, opacity, color) use a timing curve.

```ts
duration: { instant: 100, fast: 200, base: 300, slow: 500, slower: 800 }
easing:   { out: Easing.out(cubic), inOut: Easing.inOut(cubic), in: Easing.in(cubic) }
```

Reduced-motion users (iOS Accessibility setting): every animation must
collapse to a 0.01ms transition. Implemented via `useReducedMotion` from
`react-native-reanimated`.

### 3.6 Sound design (recorded here so it doesn't get lost)

We do not have a sound team. For v0.1 the only non-pep-talk audio is the
30-second alarm tone (a soft amber sine-wave swell with a subtle low-end
drop — to be designed in prompt 5). Per Apple's HIG, never play long sounds
inside the app outside of the explicit "play pep talk" moment.

---

## 4. Specific screens worth studying before prompt 2

Bookmark these and reopen before designing the equivalent OATH screen:

- **Wayk alarm-fire screen** — `apps.apple.com/us/app/wayk` — for the lower-
  third dismissal layout.
- **Headspace sleep tab** — for the muted contrast / large-target sleep UI.
- **Calm "preparing your session" screen** — for the pulsing-circle "we're
  doing work" pattern.
- **One Sec breathing screen** — for the "nothing on the screen during the
  ritual moment" discipline.
- **Linear iOS app — settings page** — for the divider weight and list-row
  craftsmanship at iOS scale.

---

## 5. What to avoid (anti-patterns)

- Gradient backgrounds. We are flat on `bg.DEFAULT` with one accent colour.
- Glassy translucent cards on top of marketing photography. None of that.
- Emoji as feature labels. Use Lucide icons or nothing.
- Multiple accent colours competing in one screen. Amber is the only warm
  channel. `future` is reserved for the v2/roadmap surface.
- Round-counter "streak" badges. We are a ritual, not a streak app.
- Bouncy spring animations on informational UI. Springs are for physical
  motion only.
- Light-mode dark-mode mirroring. We are dark only in v0.1.

---

## 6. Open questions for prompt 2

1. The "magic moment" pep talk during onboarding — is it played inside a
   modal, or does it take over the full screen? Default recommendation:
   full screen, lock-screen-style layout, dismissable only by tapping a
   small `x` after the first 10 seconds. This forces the user to *listen*
   instead of skim.
2. Should the alarm-fire screen show the script transcript? Default
   recommendation: no in v0.1. Audio only. Transcript appears on the home
   tab after dismiss for users who want to re-read what they heard.
3. Paywall placement. Kartik suggested before-paywall for the magic moment
   (user hears the generated pep talk, *then* paywall). Locked.

---

## 7. References

- [Wayk — App Store](https://apps.apple.com/us/app/wayk-alarm-clock-to-wake-up/id6758021281)
- [Pepped — App Store](https://apps.apple.com/us/app/pepped-your-ai-pep-talk-coach/id6758898942)
- [How an Alarm App Got 25M Views and 100k Downloads in 30 Days](https://read.first1000.co/p/how-an-alarm-app-got-25-million-views) — Wayk's growth story
- [Headspace — Building a Design System That Breathes (Figma)](https://www.figma.com/blog/building-a-design-system-that-breathes-with-headspace/)
- [Linear — How we redesigned the UI (part II)](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [One Sec — riedel.wtf](https://riedel.wtf/one-sec/)
- [Things 3 — Cultured Code Features](https://culturedcode.com/things/features/)
- [Apple Human Interface Guidelines — Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode/)
- [Geist Font (Vercel)](https://vercel.com/font/geist)

---
