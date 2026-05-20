// shared utilities for the typescript port

import promptsJson from './prompts.json';

const WORDS_PER_SECOND = 2.5;

export function stripJsonFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith('```')) {
    const lines = s.split('\n');
    lines.shift();
    if (lines.length && lines[lines.length - 1].trim() === '```') lines.pop();
    s = lines.join('\n').trim();
  }
  return s;
}

export function countWords(text: string): number {
  const matches = text.match(/\b\w+\b/g);
  return matches ? matches.length : 0;
}

export function findBannedPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return (promptsJson.banned_phrases as string[]).filter((p) => lower.includes(p));
}

export function estimateDurationSeconds(wordCount: number): number {
  return Math.round(wordCount / WORDS_PER_SECOND);
}

export function buildBaseSystemPrompt(mode: string, variant: string): string {
  const parts: string[] = [promptsJson.layer_1];
  const modePrompt = (promptsJson.modes as Record<string, string>)[mode];
  if (modePrompt) parts.push(modePrompt);
  const overlay = (promptsJson.variants as Record<string, string>)[variant];
  if (overlay && overlay.trim().length > 0) parts.push(overlay);
  return parts.join('\n\n');
}
