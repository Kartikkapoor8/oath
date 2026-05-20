'use client';

import { motion } from 'framer-motion';
import { PIPELINE_STAGES, STAGED_TRACE } from '@/lib/trace-data';
import SectionHeader from './SectionHeader';

const TAG_STYLES: Record<string, string> = {
  claude: 'bg-amber-glow text-amber border-amber/40',
  parallel: 'bg-amber-glow/60 text-amber-bright border-amber/30',
  logic: 'bg-fg-dim/40 text-fg-muted border-fg-dim/60',
  elevenlabs: 'bg-success/15 text-success border-success/40',
  stub: 'bg-future-glow text-future-bright border-future/40',
  conditional: 'bg-fg-dim/40 text-fg-muted border-fg-dim/60',
};

function StageCard({
  stage,
  index,
}: {
  stage: (typeof PIPELINE_STAGES)[number];
  index: number;
}) {
  const isFanOut = stage.fanOut && stage.fanOut > 1;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
      className="relative"
    >
      <div className="relative rounded-2xl border border-fg-dim/50 bg-bg-raised px-5 py-4 md:px-6 md:py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[0.65rem] text-amber-dim tracking-[0.2em] uppercase mb-1.5">
              stage {stage.number}
            </div>
            <div className="text-[1.0625rem] font-semibold leading-tight">{stage.name}</div>
            <p className="mt-2 text-[0.875rem] text-fg-muted leading-relaxed max-w-xl">
              {stage.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stage.tags.map((t) => (
                <span
                  key={t.label}
                  className={`font-mono text-[0.65rem] tracking-wider uppercase px-2 py-0.5 rounded border ${
                    TAG_STYLES[t.tone] ?? TAG_STYLES.logic
                  }`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
          {isFanOut ? (
            <div className="shrink-0 flex flex-col gap-1 items-end">
              {Array.from({ length: stage.fanOut! }).map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-1 rounded-full bg-amber/40"
                  style={{ opacity: 0.5 + 0.2 * i }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {/* connector line down to the next card */}
      {index < PIPELINE_STAGES.length - 1 ? (
        <div className="absolute -bottom-4 left-9 w-px h-4 bg-amber/30" />
      ) : null}
    </motion.div>
  );
}

const STATS = [
  { value: `${STAGED_TRACE.total_elapsed_seconds}s`, label: 'total elapsed (real run)' },
  { value: `${STAGED_TRACE.total_claude_calls}`, label: 'claude calls per generation' },
  { value: `${STAGED_TRACE.winning_overall}/10`, label: 'winning candidate critique' },
];

export default function PipelineDiagram() {
  return (
    <section id="engine" className="relative w-full py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <SectionHeader
          caption="03 — the pipeline"
          headline="not an API call. an engine."
          body={
            <>
              oath runs 10 distinct stages with 8 separate claude calls, parallel candidate generation, structured
              critique with a 6-axis rubric, conditional refinement, llm-as-judge final scoring, and mode-tuned
              prosody. every stage&apos;s input and output is logged for traceability.
            </>
          }
        />

        <div className="mt-14 grid md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-start">
          <div className="space-y-4">
            {PIPELINE_STAGES.map((s, i) => (
              <StageCard key={s.id} stage={s} index={i} />
            ))}
          </div>

          <div className="md:w-[240px] grid grid-cols-1 gap-3 sticky top-24 self-start">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.08 }}
                className="rounded-2xl border border-amber/30 bg-amber-glow px-5 py-5 backdrop-blur-sm"
              >
                <div className="font-mono text-[1.625rem] font-semibold text-amber tabular-nums tracking-tight">
                  {s.value}
                </div>
                <div className="mt-1 text-[0.75rem] text-fg-muted leading-snug">{s.label}</div>
              </motion.div>
            ))}
            <a
              href={STAGED_TRACE.github_trace_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.8125rem] text-amber hover:text-amber-bright underline underline-offset-4 mt-2"
            >
              view full pipeline_run.json →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
