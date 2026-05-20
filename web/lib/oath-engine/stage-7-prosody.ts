// stage 7: prosody markup (pure logic). mirrors pipeline/v2/stage_7_prosody.py

import 'server-only';

interface ProsodyTuning {
  major_pause: number;
  minor_pause: number;
  grounding_pause: number;
  hero_pause: number;
}

const MODE_PROSODY: Record<string, ProsodyTuning> = {
  hardest_work: { major_pause: 1.5, minor_pause: 0.7, grounding_pause: 1.5, hero_pause: 1.0 },
  gym_now: { major_pause: 0.8, minor_pause: 0.4, grounding_pause: 0.8, hero_pause: 0.6 },
  grounding_phrases: { major_pause: 2.5, minor_pause: 1.0, grounding_pause: 2.5, hero_pause: 1.5 },
};

function pauseTag(seconds: number): string {
  const s = Math.max(0.3, Math.min(2.8, seconds));
  return `<break time="${s.toFixed(1)}s" />`;
}

function findGroundingLineIndices(script: string, phrase: string): Set<number> {
  const out = new Set<number>();
  const p = phrase.toLowerCase().trim().replace(/[.,!?]$/g, '');
  if (!p) return out;
  const lines = script.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(p)) out.add(i);
  }
  return out;
}

export function addProsodyMarkup(script: string, mode: string, groundingPhrase = ''): string {
  if (!script.trim()) return script;
  const settings = MODE_PROSODY[mode] ?? MODE_PROSODY.hardest_work;
  const lines = script.split('\n');
  const groundingIndices = groundingPhrase ? findGroundingLineIndices(script, groundingPhrase) : new Set<number>();

  const out: string[] = [];
  let prevBlank = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const stripped = raw.trim();
    const isBlank = stripped === '';

    if (isBlank) {
      if (!prevBlank) {
        // find prev/next non-blank to decide pause type
        let nextIdx = -1;
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim()) {
            nextIdx = j;
            break;
          }
        }
        let prevIdx = -1;
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].trim()) {
            prevIdx = j;
            break;
          }
        }
        const isGroundingNeighbor = groundingIndices.has(nextIdx) || groundingIndices.has(prevIdx);
        const pause = isGroundingNeighbor ? settings.grounding_pause : settings.major_pause;
        out.push(pauseTag(pause));
      }
      prevBlank = true;
      continue;
    }

    // short single-word imperative line that follows another short imperative — minor pause
    const isShortCommand = stripped.split(/\s+/).length <= 2 && /[.!]$/.test(stripped);
    if (isShortCommand && out.length && !out[out.length - 1].startsWith('<break')) {
      const prevText = out[out.length - 1].trim();
      if (prevText.split(/\s+/).length <= 3 && /[.!]$/.test(prevText)) {
        out.push(pauseTag(settings.minor_pause));
      }
    }
    out.push(raw);
    prevBlank = false;
  }

  return out.join('\n');
}

export function countBreakTags(text: string): number {
  return (text.match(/<break\s+time=/g) ?? []).length;
}
