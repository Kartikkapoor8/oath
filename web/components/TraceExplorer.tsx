'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { STAGED_TRACE } from '@/lib/trace-data';

// expandable view of the pipeline_run.json from experiments/04. shows oliver
// the key numbers (8 calls, 25s, scores, refinement skipped) without dumping
// raw json. links out to the actual file on github for the full trace.

export default function TraceExplorer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-fg-dim/40 bg-bg-raised/40">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-bg-raised/60 transition-colors rounded-2xl"
        aria-expanded={open}
      >
        <div>
          <div className="caption text-amber-dim">see the trace</div>
          <div className="mt-1 text-[0.9375rem] text-fg-muted">
            8 claude calls executed in {STAGED_TRACE.total_elapsed_seconds}s · winning candidate scored{' '}
            {STAGED_TRACE.winning_overall}/10
          </div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={18} className="text-amber" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="border-t border-fg-dim/30 pt-5 grid sm:grid-cols-2 gap-x-8 gap-y-3">
                <Row label="total elapsed" value={`${STAGED_TRACE.total_elapsed_seconds}s`} />
                <Row label="claude calls" value={String(STAGED_TRACE.total_claude_calls)} />
                <Row label="elevenlabs calls" value={String(STAGED_TRACE.total_elevenlabs_calls)} />
                <Row
                  label="candidates generated"
                  value={`3 in parallel (temps ${STAGED_TRACE.candidate_summary.map((c) => c.temperature).join(', ')})`}
                />
                <Row
                  label="critique scores"
                  value={STAGED_TRACE.candidate_summary.map((c) => `${c.overall_score}/10`).join(' / ')}
                />
                <Row
                  label="winner"
                  value={`candidate ${STAGED_TRACE.winning_candidate_id} (${STAGED_TRACE.winning_overall}/10 overall, temp ${STAGED_TRACE.winning_temperature})`}
                />
                <Row
                  label="refinement"
                  value={STAGED_TRACE.refinement_triggered ? 'triggered' : 'skipped — winner passed threshold'}
                />
                <Row
                  label="final judge"
                  value={`${STAGED_TRACE.final_judge_score}/10, get_out_of_bed: ${STAGED_TRACE.get_out_of_bed ? 'true' : 'false'}`}
                />
                <Row label="prosody breaks inserted" value={String(STAGED_TRACE.prosody_break_count)} />
                <Row label="mode-tuned voice" value="hardest_work · the_closer (Adam)" />
              </div>

              <div className="mt-5 pt-5 border-t border-fg-dim/30 flex flex-wrap gap-4">
                <a
                  href={STAGED_TRACE.github_trace_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[0.8125rem] text-amber hover:text-amber-bright"
                >
                  view full pipeline_run.json
                  <ExternalLink size={13} />
                </a>
                <a
                  href={STAGED_TRACE.github_stage_outputs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[0.8125rem] text-amber hover:text-amber-bright"
                >
                  view per-stage JSON files
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-fg-subtle shrink-0">
        {label}
      </span>
      <span className="font-mono text-[0.8125rem] text-fg text-right">{value}</span>
    </div>
  );
}
