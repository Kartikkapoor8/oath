'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Dumbbell, Anchor, Check, Loader2, AlertTriangle, Minus } from 'lucide-react';
import SectionHeader from './SectionHeader';
import AudioPlayer from './AudioPlayer';
import { PIPELINE_STAGES } from '@/lib/trace-data';

type Mode = 'hardest_work' | 'gym_now' | 'grounding_phrases';
type Variant = 'default' | 'more_clipped' | 'more_narrative' | 'hero_anchor_heavy' | 'grounding_heavy';
type VoicePreset = 'the_closer' | 'the_drill' | 'the_stoic' | 'the_coach' | 'the_friend';

type StageStatus = 'queued' | 'running' | 'complete' | 'skipped' | 'error';

interface StageState {
  status: StageStatus;
  elapsedMs?: number;
  output?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  error?: string;
}

interface FinalResult {
  script: string;
  audio_url: string;
  final_score: number;
  get_out_of_bed: boolean;
  judge_notes: string;
  refinement_triggered: boolean;
  total_elapsed_ms: number;
  total_claude_calls: number;
  total_elevenlabs_calls: number;
}

const MODE_OPTIONS: Array<{ key: Mode; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: 'hardest_work', label: 'hardest_work', icon: Brain },
  { key: 'gym_now', label: 'gym_now', icon: Dumbbell },
  { key: 'grounding_phrases', label: 'grounding_phrases', icon: Anchor },
];

const VARIANT_OPTIONS: Variant[] = ['default', 'more_clipped', 'more_narrative', 'hero_anchor_heavy', 'grounding_heavy'];
const VOICE_OPTIONS: Array<{ key: VoicePreset; label: string }> = [
  { key: 'the_closer', label: 'the_closer (harvey specter energy)' },
  { key: 'the_drill', label: 'the_drill (drill sergeant energy)' },
  { key: 'the_stoic', label: 'the_stoic (marcus aurelius energy)' },
  { key: 'the_coach', label: 'the_coach (phil jackson energy)' },
  { key: 'the_friend', label: 'the_friend (closest friend energy)' },
];

function initialStageStates(): Record<string, StageState> {
  return Object.fromEntries(PIPELINE_STAGES.map((s) => [s.id, { status: 'queued' as StageStatus }]));
}

export default function TryYourOwn() {
  const [mode, setMode] = useState<Mode>('hardest_work');
  const [intent, setIntent] = useState('');
  const [firstAction, setFirstAction] = useState('');
  const [hero, setHero] = useState('');
  const [phrase, setPhrase] = useState('');
  const [variant, setVariant] = useState<Variant>('default');
  const [voice, setVoice] = useState<VoicePreset>('the_closer');

  const [running, setRunning] = useState(false);
  const [stageStates, setStageStates] = useState<Record<string, StageState>>(initialStageStates());
  const [result, setResult] = useState<FinalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const disabled = running || !intent.trim() || !firstAction.trim() || !hero.trim() || !phrase.trim();

  const reset = () => {
    abortRef.current?.abort();
    setRunning(false);
    setStageStates(initialStageStates());
    setResult(null);
    setError(null);
  };

  async function handleSubmit() {
    setRunning(true);
    setError(null);
    setResult(null);
    setStageStates(initialStageStates());

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          intent: intent.trim(),
          first_action: firstAction.trim(),
          hero: hero.trim(),
          phrase: phrase.trim(),
          variant,
          voice,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '');
        throw new Error(`request failed (${response.status}): ${text.slice(0, 200)}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split('\n\n');
        buf = events.pop() ?? '';
        for (const evt of events) {
          if (!evt.startsWith('data: ')) continue;
          const payload = evt.slice(6);
          try {
            const data = JSON.parse(payload);
            handleEvent(data);
          } catch (e) {
            console.error('failed to parse sse event', e, payload);
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  function handleEvent(data: {
    stage: string;
    status?: StageStatus;
    elapsed_ms?: number;
    output?: Record<string, unknown>;
    meta?: Record<string, unknown>;
    error?: string;
    [k: string]: unknown;
  }) {
    if (data.stage === 'final') {
      setResult({
        script: (data.script as string) ?? '',
        audio_url: (data.audio_url as string) ?? '',
        final_score: (data.final_score as number) ?? 0,
        get_out_of_bed: (data.get_out_of_bed as boolean) ?? false,
        judge_notes: (data.judge_notes as string) ?? '',
        refinement_triggered: (data.refinement_triggered as boolean) ?? false,
        total_elapsed_ms: (data.total_elapsed_ms as number) ?? 0,
        total_claude_calls: (data.total_claude_calls as number) ?? 0,
        total_elevenlabs_calls: (data.total_elevenlabs_calls as number) ?? 0,
      });
      return;
    }
    if (data.stage === 'error') {
      setError(data.error ?? 'pipeline error');
      return;
    }
    // stage event
    setStageStates((prev) => ({
      ...prev,
      [data.stage]: {
        status: data.status ?? 'running',
        elapsedMs: data.elapsed_ms,
        output: data.output,
        meta: data.meta,
        error: data.error,
      },
    }));
  }

  return (
    <section id="try-your-own" className="relative w-full py-24 md:py-32 bg-bg-raised/30">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <SectionHeader
          caption="02 — try the engine"
          headline="type your inputs. watch the pipeline run."
          body={
            <>
              the engine runs the same 10 stages whether it&apos;s me at 6am or you right now. claude analyzes your
              inputs, generates 3 candidates in parallel, critiques each against a 6-axis rubric, picks the winner,
              refines if needed, judges quality, adds prosody markup, then synthesizes via elevenlabs. real
              generation. 20-30 seconds.
            </>
          }
        />

        <div className="mt-12 grid lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8 items-start">
          {/* form */}
          <div className="rounded-3xl border border-fg-dim/60 bg-bg-raised p-6 md:p-8">
            <div>
              <label className="caption block mb-3 text-amber-dim">mode</label>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-bg p-1.5 border border-fg-dim/40">
                {MODE_OPTIONS.map(({ key, label, icon: Icon }) => {
                  const active = mode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMode(key)}
                      disabled={running}
                      className={`relative rounded-xl py-3 px-2 text-[0.8125rem] font-medium transition-all flex items-center justify-center gap-2 ${
                        active
                          ? 'bg-amber text-bg shadow-[0_4px_12px_-4px_rgba(245,158,11,0.4)]'
                          : 'text-fg-muted hover:text-fg'
                      }`}
                    >
                      <Icon size={15} />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Field
                label="intent"
                value={intent}
                onChange={setIntent}
                placeholder="ship the spec for the meeting"
                maxLength={100}
                disabled={running}
                helper="the hardest task you'd commit to last night"
              />
              <Field
                label="first action"
                value={firstAction}
                onChange={setFirstAction}
                placeholder="open the doc and write the first section"
                maxLength={80}
                disabled={running}
                helper="what you'll do in the first 5 minutes"
              />
              <Field
                label="hero"
                value={hero}
                onChange={setHero}
                placeholder="kobe, harvey specter, your dad — anyone you look up to"
                maxLength={40}
                disabled={running}
                helper="referenced as a character, not voiced"
              />
              <Field
                label="grounding phrase"
                value={phrase}
                onChange={setPhrase}
                placeholder="trust the work"
                maxLength={60}
                disabled={running}
                helper="your mantra — used verbatim"
              />
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="caption block mb-2 text-amber-dim">variant</label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value as Variant)}
                  disabled={running}
                  className="w-full rounded-xl bg-bg border border-fg-dim/60 px-4 py-3 text-[0.875rem] text-fg focus:border-amber focus:outline-none disabled:opacity-60"
                >
                  {VARIANT_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="caption block mb-2 text-amber-dim">voice</label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as VoicePreset)}
                  disabled={running}
                  className="w-full rounded-xl bg-bg border border-fg-dim/60 px-4 py-3 text-[0.875rem] text-fg focus:border-amber focus:outline-none disabled:opacity-60"
                >
                  {VOICE_OPTIONS.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-7 flex items-center gap-4">
              {!running && !result ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={disabled}
                  className="rounded-full bg-amber text-bg px-7 py-3.5 text-sm font-semibold tracking-tight transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_8px_25px_-8px_rgba(245,158,11,0.5)] disabled:shadow-none"
                >
                  swear it
                </button>
              ) : null}
              {result || error ? (
                <button
                  type="button"
                  onClick={reset}
                  className="text-fg-muted hover:text-amber text-sm underline underline-offset-2"
                >
                  try another
                </button>
              ) : null}
              {running ? (
                <div className="flex items-center gap-2 text-fg-muted text-sm">
                  <Loader2 size={14} className="animate-spin text-amber" />
                  running pipeline…
                </div>
              ) : null}
            </div>
          </div>

          {/* pipeline trace */}
          <div className="rounded-3xl border border-fg-dim/60 bg-bg-raised p-6 md:p-8">
            <div className="caption mb-5 text-amber-dim">pipeline trace</div>
            <div className="space-y-2">
              {PIPELINE_STAGES.map((s, i) => {
                const state = stageStates[s.id] ?? { status: 'queued' as StageStatus };
                return (
                  <StageRow key={s.id} index={i} stage={s} state={state} />
                );
              })}
            </div>
            {error ? (
              <div className="mt-4 rounded-xl border border-error/40 bg-error/10 p-3 text-[0.8125rem] text-error">
                error: {error}
              </div>
            ) : null}
          </div>
        </div>

        {/* result panel */}
        <AnimatePresence>
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 rounded-3xl border border-amber/30 bg-amber-glow/30 p-6 md:p-10"
            >
              <div className="flex items-baseline justify-between mb-5">
                <div className="caption text-amber-dim">your ritual</div>
                <div className="font-mono text-[0.75rem] text-fg-muted tabular-nums">
                  judge: {result.final_score}/10 · {result.get_out_of_bed ? 'get_out_of_bed: true' : 'get_out_of_bed: false'} ·{' '}
                  {Math.round(result.total_elapsed_ms / 100) / 10}s · {result.total_claude_calls} claude calls
                </div>
              </div>
              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
                <div className="font-sans whitespace-pre-wrap text-[1rem] md:text-[1.0625rem] leading-[1.85] text-fg">
                  {result.script}
                </div>
                <div>
                  <AudioPlayer src={result.audio_url} downloadName={`oath-${mode}.mp3`} size="md" />
                  <div className="mt-4 text-[0.8125rem] text-fg-muted italic leading-relaxed">
                    judge: &ldquo;{result.judge_notes}&rdquo;
                  </div>
                  {result.refinement_triggered ? (
                    <div className="mt-3 text-[0.75rem] text-amber-bright">
                      ↻ refinement was triggered (stage 5)
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function StageRow({
  index,
  stage,
  state,
}: {
  index: number;
  stage: (typeof PIPELINE_STAGES)[number];
  state: StageState;
}) {
  const isRunning = state.status === 'running';
  const isComplete = state.status === 'complete';
  const isSkipped = state.status === 'skipped';
  const isError = state.status === 'error';

  return (
    <motion.div
      layout
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-xl border px-4 py-3 transition-colors ${
        isRunning
          ? 'border-amber/50 bg-amber-glow'
          : isComplete
          ? 'border-success/30 bg-success/5'
          : isError
          ? 'border-error/40 bg-error/5'
          : isSkipped
          ? 'border-fg-dim/30 bg-bg/30 opacity-60'
          : 'border-fg-dim/30 bg-bg/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="font-mono text-[0.65rem] text-fg-subtle w-6 shrink-0">{stage.number}</div>
        <div className="w-5 h-5 shrink-0 flex items-center justify-center">
          {isRunning ? <Loader2 size={14} className="animate-spin text-amber" /> : null}
          {isComplete ? <Check size={14} className="text-success" /> : null}
          {isError ? <AlertTriangle size={14} className="text-error" /> : null}
          {isSkipped ? <Minus size={14} className="text-fg-subtle" /> : null}
          {state.status === 'queued' ? <div className="w-2 h-2 rounded-full bg-fg-dim" /> : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[0.875rem] font-medium leading-tight">{stage.name}</div>
          {state.output || state.meta ? (
            <div className="mt-0.5 font-mono text-[0.7rem] text-fg-subtle truncate">
              {summarize(stage.id, state)}
            </div>
          ) : null}
        </div>
        <div className="font-mono text-[0.7rem] text-fg-subtle tabular-nums shrink-0">
          {isComplete && typeof state.elapsedMs === 'number'
            ? `${(state.elapsedMs / 1000).toFixed(1)}s`
            : isSkipped
            ? 'skipped'
            : isRunning
            ? 'running…'
            : ''}
        </div>
      </div>
    </motion.div>
  );
}

function summarize(stageId: string, state: StageState): string {
  const o = state.output;
  if (!o) {
    if (stageId === 'stage_5_refine' && state.status === 'skipped') return 'winner passed threshold';
    if (stageId === 'stage_9_music_bed' && state.status === 'skipped') return 'v1.1 stub';
    return '';
  }
  if (stageId === 'stage_1_analyze') {
    const c = o.estimated_complexity as string | undefined;
    return c ? `complexity: ${c}` : '';
  }
  if (stageId === 'stage_2_generate') {
    const wc = o.word_counts as number[] | undefined;
    const temps = o.temperatures as number[] | undefined;
    return wc && temps ? `3 candidates · ${wc.join(', ')} words · temps ${temps.join(', ')}` : '';
  }
  if (stageId === 'stage_3_critique') {
    const scores = o.overall_scores as number[] | undefined;
    return scores ? `scores: ${scores.map((s) => s.toFixed(2)).join(' / ')}` : '';
  }
  if (stageId === 'stage_4_select') {
    const wid = o.winner_id as number | undefined;
    const overall = o.winning_overall as number | undefined;
    const refine = o.refinement_needed as boolean | undefined;
    return wid && overall ? `winner: candidate ${wid} (${overall.toFixed(2)}/10)${refine ? ' · refine' : ''}` : '';
  }
  if (stageId === 'stage_5_refine') {
    const fix = o.what_was_fixed as string | undefined;
    return fix ? fix.slice(0, 64) : '';
  }
  if (stageId === 'stage_6_judge') {
    const score = o.final_quality_score as number | undefined;
    const got = o.would_get_user_out_of_bed as boolean | undefined;
    return score !== undefined ? `${score}/10 · get_out_of_bed: ${got ? 'true' : 'false'}` : '';
  }
  if (stageId === 'stage_7_prosody') {
    const n = o.break_count as number | undefined;
    return n !== undefined ? `${n} <break /> tags inserted` : '';
  }
  if (stageId === 'stage_8_synthesize') {
    const dur = o.estimated_duration_seconds as number | undefined;
    const label = o.voice_label as string | undefined;
    return dur ? `${dur}s · ${label ?? ''}` : '';
  }
  return '';
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  disabled,
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
  disabled?: boolean;
  helper?: string;
}) {
  return (
    <div>
      <label className="caption block mb-2 text-amber-dim">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full rounded-xl bg-bg border border-fg-dim/60 px-4 py-3 text-[0.9375rem] text-fg placeholder:text-fg-subtle focus:border-amber focus:outline-none disabled:opacity-60 transition-colors"
      />
      <div className="mt-1.5 flex items-center justify-between text-[0.75rem]">
        <span className="text-fg-subtle">{helper}</span>
        <span className="font-mono text-fg-subtle">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
