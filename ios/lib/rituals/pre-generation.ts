import * as FileSystem from 'expo-file-system/legacy';
import {
  generateRitual,
  PipelineError,
  type FinalEvent,
  type PipelineInputs,
  type StageEvent,
} from '@/lib/api/oath-engine';
import {
  getPreferences,
  setPreferences,
  type UserPreferences,
} from '@/lib/storage/preferences';
import {
  getDefaultFirstAction,
  getIntentText,
} from '@/lib/helpers/onboarding-defaults';

const RITUAL_CACHE_DIR = `${FileSystem.cacheDirectory}rituals/`;

export type PreGenStatus = 'idle' | 'running' | 'success' | 'error';

let currentStatus: PreGenStatus = 'idle';
let lastError: PipelineError | null = null;
let inflight: Promise<PreGenResult | null> | null = null;
const listeners = new Set<(s: PreGenStatus) => void>();

function setStatus(s: PreGenStatus, err: PipelineError | null = null) {
  currentStatus = s;
  lastError = err;
  listeners.forEach((fn) => {
    try {
      fn(s);
    } catch (e) {
      console.warn('pre-gen listener threw', e);
    }
  });
}

export function getPreGenStatus(): PreGenStatus {
  return currentStatus;
}

export function getPreGenLastError(): PipelineError | null {
  return lastError;
}

export function subscribePreGen(
  fn: (status: PreGenStatus) => void,
): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

async function ensureCacheDir() {
  const info = await FileSystem.getInfoAsync(RITUAL_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RITUAL_CACHE_DIR, {
      intermediates: true,
    });
  }
}

async function writeDataUrl(dataUrl: string, targetUri: string): Promise<void> {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx < 0) throw new Error('not a data URL');
  const base64 = dataUrl.slice(commaIdx + 1);
  await FileSystem.writeAsStringAsync(targetUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export interface PreGenResult {
  audio_file_uri: string;
  script: string;
  final_score: number;
  generated_at: string;
}

function buildRequest(prefs: UserPreferences): PipelineInputs {
  const firstAction =
    prefs.tomorrowFirstAction?.trim() || getDefaultFirstAction(prefs.defaultMode);
  return {
    mode: prefs.defaultMode,
    intent: getIntentText(prefs.defaultMode),
    first_action: firstAction,
    hero: prefs.hero || 'someone you respect',
    phrase: prefs.groundingPhrase || 'trust the work',
    variant: 'default',
    voice: prefs.voicePreset,
  };
}

/**
 * Pre-generates the next morning's ritual and caches it on device.
 * Idempotent: if already running, returns the in-flight promise.
 * On success: writes the audio file to the cache directory and updates
 * preferences (nextRitualPath/Script/GeneratedAt/Voice/FirstAction).
 */
export function preGenerateNextRitual(): Promise<PreGenResult | null> {
  if (inflight) return inflight;
  setStatus('running');

  const work = (async (): Promise<PreGenResult | null> => {
    try {
      const prefs = await getPreferences();
      if (!prefs.hasOnboarded) {
        setStatus('idle');
        return null;
      }

      await ensureCacheDir();
      const req = buildRequest(prefs);

      const iter = generateRitual(req);
      let final: FinalEvent | null = null;
      while (true) {
        const { done, value } = await iter.next();
        if (done) {
          final = (value ?? null) as FinalEvent | null;
          break;
        }
        // value is StageEvent — we don't need per-stage info for caching
        void (value as StageEvent);
      }

      if (!final || !final.audio_url) {
        throw new PipelineError(
          'pre-gen finished without audio',
          undefined,
          true,
        );
      }

      const fileName = `next-ritual-${Date.now()}.mp3`;
      const targetUri = `${RITUAL_CACHE_DIR}${fileName}`;

      if (final.audio_url.startsWith('data:')) {
        await writeDataUrl(final.audio_url, targetUri);
      } else {
        // Remote URL (not the current engine shape, but handle for the future)
        await FileSystem.downloadAsync(final.audio_url, targetUri);
      }

      const oldPath = prefs.nextRitualPath;
      const result: PreGenResult = {
        audio_file_uri: targetUri,
        script: final.script,
        final_score: final.final_score,
        generated_at: new Date().toISOString(),
      };

      await setPreferences({
        nextRitualPath: targetUri,
        nextRitualScript: final.script,
        nextRitualGeneratedAt: result.generated_at,
        nextRitualVoice: req.voice ?? 'the_closer',
        nextRitualFirstAction: req.first_action,
        nextRitualFinalScore: final.final_score,
      });

      // Clean up the prior cached audio so the cache doesn't grow unbounded
      if (oldPath && oldPath !== targetUri) {
        try {
          await FileSystem.deleteAsync(oldPath, { idempotent: true });
        } catch {}
      }

      setStatus('success');
      return result;
    } catch (err) {
      const pe =
        err instanceof PipelineError
          ? err
          : new PipelineError(
              err instanceof Error ? err.message : String(err),
              undefined,
              true,
            );
      console.warn('pre-gen failed', pe);
      setStatus('error', pe);
      return null;
    } finally {
      inflight = null;
    }
  })();

  inflight = work;
  return work;
}

export async function clearCachedRitual(): Promise<void> {
  const prefs = await getPreferences();
  if (prefs.nextRitualPath) {
    try {
      await FileSystem.deleteAsync(prefs.nextRitualPath, { idempotent: true });
    } catch {}
  }
  await setPreferences({
    nextRitualPath: null,
    nextRitualScript: null,
    nextRitualGeneratedAt: null,
    nextRitualVoice: null,
    nextRitualFirstAction: null,
    nextRitualFinalScore: null,
  });
  setStatus('idle');
}

/** Returns true if we have a cached ritual on disk that's playable. */
export async function hasCachedRitual(): Promise<boolean> {
  const prefs = await getPreferences();
  if (!prefs.nextRitualPath) return false;
  const info = await FileSystem.getInfoAsync(prefs.nextRitualPath);
  return info.exists;
}
