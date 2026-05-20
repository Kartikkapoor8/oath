'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import SectionHeader from './SectionHeader';
import AudioPlayer from './AudioPlayer';

const DIFF_BULLETS = [
  {
    label: 'hero anchor',
    v1: 'invented stat — "three hundred makes before anyone else arrived"',
    v2: 'documented drills — "left hand. mid-range. footwork off the catch."',
  },
  {
    label: 'commitment framing',
    v1: 'passive — "you said it. it\'s written."',
    v2: 'active — "that is not a goal. that is a debt coming due."',
  },
  {
    label: 'prosody',
    v1: 'zero <break /> tags — elevenlabs interprets line breaks only',
    v2: '7 explicit <break time="1.5s" /> tags inserted between major beats',
  },
  {
    label: 'voice tuning',
    v1: 'global defaults (stability 0.5, style 0.3)',
    v2: 'hardest_work-mode tuning (stability 0.6, style 0.2 — more grounded)',
  },
  {
    label: 'closing',
    v1: 'four commands — "sit up. feet on the floor. open the doc. go."',
    v2: 'one focused command — "open it."',
  },
];

export default function ComparisonSection() {
  const [open, setOpen] = useState(false);
  return (
    <section id="comparison" className="relative w-full py-24 md:py-32 bg-bg-raised/30">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <SectionHeader
          caption="05 — v1 vs v2"
          headline="single-pass vs multi-pass. listen for yourself."
          body={
            <>
              the v1 pipeline made one claude call and shipped the first output. v2 generates 3 candidates, critiques
              each against a 6-axis rubric, picks the strongest, and adds prosody markup. on this specific run, both
              scored 8.7/10 from the same judge. the v2 win isn&apos;t magical content improvement — it&apos;s
              worst-case variance and trace visibility.
            </>
          }
        />

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* v1 column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-fg-dim/50 bg-bg-raised p-6 md:p-8"
          >
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-[1.5rem] font-semibold">v1 — single pass</h3>
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-fg-subtle">
                1 claude · ~10s · ~$0.07
              </span>
            </div>
            <p className="text-[0.875rem] text-fg-muted leading-relaxed mb-5">
              one 3-layer prompt, one elevenlabs call, global voice settings. fast and cheap. no critique, no
              candidate selection, no refinement.
            </p>
            <AudioPlayer src="/v1-output.mp3" downloadName="oath-v1-output.mp3" size="md" />
          </motion.div>

          {/* v2 column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="rounded-2xl border border-amber/30 bg-amber-glow/30 p-6 md:p-8"
          >
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-[1.5rem] font-semibold">v2 — multi-pass</h3>
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-amber-dim">
                8 claude · ~25s · ~$0.13
              </span>
            </div>
            <p className="text-[0.875rem] text-fg-muted leading-relaxed mb-5">
              analyze → 3 parallel candidates → 3 parallel critiques → select → optional refine → judge → prosody →
              mode-tuned synthesis. selects best of 3, bounds the worst case, surfaces a full trace.
            </p>
            <AudioPlayer src="/v2-output.mp3" downloadName="oath-v2-output.mp3" size="md" />
          </motion.div>
        </div>

        {/* what changed */}
        <div className="mt-8 rounded-2xl border border-fg-dim/40 bg-bg-raised/40">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-bg-raised/60 transition-colors rounded-2xl"
            aria-expanded={open}
          >
            <div>
              <div className="caption text-amber-dim">what changed, line by line</div>
              <div className="mt-1 text-[0.9375rem] text-fg-muted">
                5 specific differences between v1 and v2 on this run
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
                <div className="px-6 pb-6 border-t border-fg-dim/30 pt-5 space-y-4">
                  {DIFF_BULLETS.map((b, i) => (
                    <motion.div
                      key={b.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
                      className="grid sm:grid-cols-[140px_1fr] gap-3 sm:gap-5"
                    >
                      <div className="font-mono text-[0.7rem] uppercase tracking-wider text-amber-dim pt-1">
                        {b.label}
                      </div>
                      <div className="space-y-1.5 text-[0.875rem]">
                        <div className="text-fg-muted">
                          <span className="font-mono text-fg-subtle">v1:</span> {b.v1}
                        </div>
                        <div className="text-fg">
                          <span className="font-mono text-amber">v2:</span> {b.v2}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <p className="mt-8 text-[0.8125rem] text-fg-subtle italic max-w-3xl">
          full audible comparison + comparison.md notes:{' '}
          <a
            href="https://github.com/Kartikkapoor8/oath/tree/main/experiments/05-v2-vs-v1-comparison"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber hover:text-amber-bright underline underline-offset-2"
          >
            experiments/05-v2-vs-v1-comparison/
          </a>
        </p>
      </div>
    </section>
  );
}
