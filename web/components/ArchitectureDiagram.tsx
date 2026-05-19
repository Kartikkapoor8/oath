'use client';

import { motion } from 'framer-motion';
import SectionHeader from './SectionHeader';

interface Stage {
  title: string;
  description: string;
  pill?: string;
}

const STAGES: Stage[] = [
  {
    title: 'user inputs',
    description: 'mode, intent (verbatim), first action, hero, grounding phrase',
    pill: '5 fields',
  },
  {
    title: 'layer 1: identity prompt',
    description: 'constant across all generations. defines brand voice, the 20-phrase ban list, and "no invented quotes" rule.',
    pill: 'system prompt',
  },
  {
    title: 'layer 2: mode prompt',
    description: 'tone, structural arc, mode-specific bans. one of 3 (hardest_work / gym_now / grounding_phrases).',
    pill: 'composed',
  },
  {
    title: 'layer 3: variant overlay',
    description: 'length and cadence overlay (default / more_clipped / more_narrative / hero_anchor_heavy / grounding_heavy).',
    pill: 'optional',
  },
  {
    title: 'claude sonnet 4.6',
    description: 'temperature 0.7, max_tokens 800. produces JSON with the script and metadata. 5-8s typical.',
    pill: 'generation',
  },
  {
    title: 'validation + retry',
    description: 'word count check (100-220, or 80-170 for grounding mode) and banned-phrase scan. retries once with stricter feedback if either fails.',
    pill: 'guardrail',
  },
  {
    title: 'elevenlabs flash v2.5',
    description: 'voice preset → voice id → mp3 stream. 3-5s. one of 5 archetypes mapped to distinct production voices.',
    pill: 'synthesis',
  },
  {
    title: 'mp3 cached, ready for alarm',
    description: 'in v1, the file caches on device 15 minutes before the alarm fires. plays in-app on dismiss (not as the alarm sound — alarmkit constraint).',
    pill: 'delivery',
  },
];

const STATS: Array<{ value: string; label: string }> = [
  { value: '15 / 15', label: 'scripts passed banned-phrase validation (mon night)' },
  { value: '5-8s', label: 'avg script generation time (claude sonnet 4.6)' },
  { value: '3-5s', label: 'avg audio synthesis time (elevenlabs flash v2.5)' },
];

export default function ArchitectureDiagram() {
  return (
    <section id="engine" className="relative w-full py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <SectionHeader
          caption="04 — the engine"
          headline="not an api call. an engine."
          body={
            <>
              every ritual passes through a 3-layer prompt composition, banned-phrase validation, retry logic, and a
              5-variant testing matrix. testable, traceable, and built to scale.
            </>
          }
        />

        <div className="mt-14 grid md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-start">
          {/* pipeline cards */}
          <div className="relative">
            <div className="space-y-3">
              {STAGES.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                  className="relative rounded-2xl border border-fg-dim/50 bg-bg-raised px-5 py-4 md:px-6 md:py-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-mono text-[0.65rem] text-amber-dim tracking-[0.2em] uppercase mb-1.5">
                        stage {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="text-[1.125rem] font-semibold leading-tight">{s.title}</div>
                      <p className="mt-2 text-[0.875rem] text-fg-muted leading-relaxed max-w-xl">
                        {s.description}
                      </p>
                    </div>
                    {s.pill ? (
                      <div className="shrink-0 font-mono text-[0.65rem] tracking-wider uppercase text-fg-subtle px-2 py-1 rounded border border-fg-dim/60">
                        {s.pill}
                      </div>
                    ) : null}
                  </div>
                  {/* connector */}
                  {i < STAGES.length - 1 ? (
                    <div className="absolute -bottom-3 left-9 w-px h-3 bg-amber/40" />
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>

          {/* stats column on desktop */}
          <div className="grid grid-cols-1 gap-3 md:w-[220px]">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.08 }}
                className="rounded-2xl border border-amber/30 bg-amber-glow px-5 py-5 backdrop-blur-sm"
              >
                <div className="font-mono text-[1.625rem] font-semibold text-amber tabular-nums tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-1 text-[0.75rem] text-fg-muted leading-snug">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
