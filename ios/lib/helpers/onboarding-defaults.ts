import type { Mode, VoicePreset } from '@/lib/api/oath-engine';

export function getIntentText(mode: Mode): string {
  switch (mode) {
    case 'hardest_work':
      return 'attack the hardest task on my list first';
    case 'gym_now':
      return 'complete the morning training session before any other work';
    case 'grounding_phrases':
      return 'ground myself in my phrase before starting the day';
  }
}

export function getDefaultFirstAction(mode: Mode): string {
  switch (mode) {
    case 'hardest_work':
      return 'open the project and start the hardest piece';
    case 'gym_now':
      return 'put on workout clothes and walk out the door';
    case 'grounding_phrases':
      return 'sit quietly and say the phrase three times';
  }
}

export function modeLabel(mode: Mode): string {
  switch (mode) {
    case 'hardest_work':
      return 'the hardest work';
    case 'gym_now':
      return 'the morning lift';
    case 'grounding_phrases':
      return 'the grounding moment';
  }
}

export function voiceLabel(voice: VoicePreset): string {
  switch (voice) {
    case 'the_closer':
      return 'the closer';
    case 'the_drill':
      return 'the drill';
    case 'the_stoic':
      return 'the stoic';
    case 'the_coach':
      return 'the coach';
    case 'the_friend':
      return 'the friend';
  }
}

export function voiceReference(voice: VoicePreset): string {
  switch (voice) {
    case 'the_closer':
      return 'harvey specter energy — calm, authoritative';
    case 'the_drill':
      return 'drill sergeant energy — sharp, clipped';
    case 'the_stoic':
      return 'marcus aurelius energy — measured, philosophical';
    case 'the_coach':
      return 'phil jackson energy — warm, urgent mentor';
    case 'the_friend':
      return 'closest friend energy — conversational, peer';
  }
}

export function firstName(full: string): string {
  const trimmed = full.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

export function timeOfDayGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'still up';
  if (h < 12) return 'good morning';
  if (h < 17) return 'good afternoon';
  if (h < 21) return 'good evening';
  return 'good night';
}

export function formatAlarmTime12h(time24: string | null): string {
  if (!time24) return '— : —';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return '— : —';
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatDateCaption(date = new Date()): string {
  const day = date
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase();
  const month = date
    .toLocaleDateString('en-US', { month: 'long' })
    .toUpperCase();
  const num = date.getDate();
  return `${day} · ${month} ${num}`;
}
