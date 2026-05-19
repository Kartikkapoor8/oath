'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Dumbbell, Anchor, Check, Loader2 } from 'lucide-react';
import SectionHeader from './SectionHeader';
import AudioPlayer from './AudioPlayer';

type Mode = 'hardest_work' | 'gym_now' | 'grounding_phrases';

const MODE_OPTIONS: Array<{ key: Mode; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: 'hardest_work', label: 'hardest_work', icon: Brain },
  { key: 'gym_now', label: 'gym_now', icon: Dumbbell },
  { key: 'grounding_phrases', label: 'grounding_phrases', icon: Anchor },
];

type Stage = 'idle' | 'script' | 'audio' | 'done' | 'error';

interface ScriptResult {
  script: string;
  word_count: number;
  estimated_duration_seconds: number;
  violations: string[];
}

interface AudioResult {
  audio_base64: string;
  estimated_duration_seconds: number;
  voice_label: string;
}

export default function TryYourOwn() {
  const [mode, setMode] = useState<Mode>('hardest_work');
  const [intent, setIntent] = useState('');
  const [firstAction, setFirstAction] = useState('');
  const [hero, setHero] = useState('');
  const [phrase, setPhrase] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [scriptRes, setScriptRes] = useState<ScriptResult | null>(null);
  const [audioRes, setAudioRes] = useState<AudioResult | null>(null);

  const intentExamples = [
    'ship the spec for the meeting',
    'finish the prototype before standup',
    'do the morning run before opening slack',
  ];
  const exampleIntent = intentExamples[0];

  const disabled =
    stage === 'script' ||
    stage === 'audio' ||
    !intent.trim() ||
    !firstAction.trim() ||
    !hero.trim() ||
    !phrase.trim();

  const run = async () => {
    setError(null);
    setScriptRes(null);
    setAudioRes(null);
    setStage('script');
    try {
      const sRes = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          intent: intent.trim(),
          first_action: firstAction.trim(),
          hero: hero.trim(),
          phrase: phrase.trim(),
          variant: 'default',
        }),
      });
      if (!sRes.ok) {
        const j = await sRes.json().catch(() => ({}));
        throw new Error(j.error ?? `script generation failed (${sRes.status})`);
      }
      const sData: ScriptResult = await sRes.json();
      setScriptRes(sData);
      setStage('audio');

      const aRes = await fetch('/api/synthesize-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: sData.script, voice_preset: 'the_closer' }),
      });
      if (!aRes.ok) {
        const j = await aRes.json().catch(() => ({}));
        throw new Error(j.error ?? `audio synthesis failed (${aRes.status})`);
      }
      const aData: AudioResult = await aRes.json();
      setAudioRes(aData);
      setStage('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'something went wrong');
      setStage('error');
    }
  };

  const reset = () => {
    setStage('idle');
    setScriptRes(null);
    setAudioRes(null);
    setError(null);
  };

  return (
    <section id="try-your-own" className="relative w-full py-24 md:py-32 bg-bg-raised/30">
      <div className="mx-auto w-full max-w-5xl px-6 md:px-12">
        <SectionHeader
          caption="03 — try the engine"
          headline="type your own inputs. see the engine work."
          body={
            <>
              the engine takes 5 inputs and runs them through claude sonnet 4.6 with a 3-layer prompt system, validates
              against a banned-phrase list, then synthesizes via elevenlabs flash. real generation. real audio. 10-15
              seconds per ritual.
            </>
          }
        />

        <div className="mt-12 rounded-3xl border border-fg-dim/60 bg-bg-raised p-6 md:p-10">
          {/* mode segmented control */}
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
                    disabled={stage === 'script' || stage === 'audio'}
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

          {/* text inputs */}
          <div className="mt-6 grid md:grid-cols-2 gap-5">
            <Field
              label="intent"
              value={intent}
              onChange={setIntent}
              placeholder={exampleIntent}
              maxLength={80}
              disabled={stage === 'script' || stage === 'audio'}
              helper="the hardest task you'd commit to last night"
            />
            <Field
              label="first action"
              value={firstAction}
              onChange={setFirstAction}
              placeholder="open the doc and write the first section"
              maxLength={60}
              disabled={stage === 'script' || stage === 'audio'}
              helper="what you'll do in the first 5 minutes"
            />
            <Field
              label="hero"
              value={hero}
              onChange={setHero}
              placeholder="kobe bryant, harvey specter, your dad — anyone"
              maxLength={40}
              disabled={stage === 'script' || stage === 'audio'}
              helper="someone you look up to (referenced as a character, not voiced)"
            />
            <Field
              label="grounding phrase"
              value={phrase}
              onChange={setPhrase}
              placeholder="trust the work"
              maxLength={60}
              disabled={stage === 'script' || stage === 'audio'}
              helper="your mantra — used verbatim in the script"
            />
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-start gap-4">
            {stage === 'idle' || stage === 'error' ? (
              <button
                type="button"
                onClick={run}
                disabled={disabled}
                className="rounded-full bg-amber text-bg px-7 py-3.5 text-sm font-semibold tracking-tight transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_8px_25px_-8px_rgba(245,158,11,0.5)] disabled:shadow-none"
              >
                swear it
              </button>
            ) : null}
            {stage === 'script' ? (
              <div className="flex items-center gap-3 text-fg-muted">
                <Loader2 size={16} className="animate-spin text-amber" />
                <span className="text-sm">generating script with claude sonnet 4.6…</span>
              </div>
            ) : null}
            {stage === 'audio' ? (
              <div className="flex items-center gap-3 text-fg-muted">
                <Loader2 size={16} className="animate-spin text-amber" />
                <span className="text-sm">synthesizing audio with elevenlabs flash v2.5…</span>
              </div>
            ) : null}
            {stage === 'done' ? (
              <div className="flex items-center gap-3 text-success">
                <Check size={16} />
                <span className="text-sm">ready</span>
                <button onClick={reset} className="ml-2 text-fg-muted hover:text-amber text-sm underline underline-offset-2">
                  try another
                </button>
              </div>
            ) : null}
            {stage === 'error' && error ? (
              <div className="text-error text-sm">error: {error}</div>
            ) : null}
          </div>
        </div>

        {/* result panel */}
        {(stage === 'done' || (stage === 'audio' && scriptRes)) && scriptRes ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 rounded-3xl border border-amber/30 bg-bg-raised p-6 md:p-10"
          >
            <div className="caption mb-5 text-amber-dim">your ritual</div>
            <div className="grid md:grid-cols-[1.4fr_1fr] gap-8 items-start">
              <div className="font-sans whitespace-pre-wrap text-[1rem] md:text-[1.0625rem] leading-[1.85] text-fg">
                {scriptRes.script}
              </div>
              <div>
                {audioRes ? (
                  <AudioPlayer
                    src={audioRes.audio_base64}
                    downloadName={`oath-${mode}.mp3`}
                    size="md"
                  />
                ) : (
                  <div className="flex items-center gap-3 text-fg-muted text-sm">
                    <Loader2 size={16} className="animate-spin text-amber" />
                    synthesizing…
                  </div>
                )}
                <div className="mt-5 font-mono text-[0.75rem] text-fg-subtle tracking-wide">
                  {scriptRes.word_count} words • ~{scriptRes.estimated_duration_seconds}s
                  {scriptRes.violations.length > 0
                    ? ` • flagged: ${scriptRes.violations.join(', ')}`
                    : ' • zero violations'}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
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
