'use client';

import { motion } from 'framer-motion';
import { FileCheck2, FlaskConical, Bed, GitBranch, ArrowUpRight } from 'lucide-react';
import SectionHeader from './SectionHeader';

const REPO = 'https://github.com/Kartikkapoor8/oath';

interface Receipt {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  headline: string;
  body: string;
  link: string;
  linkLabel: string;
}

const RECEIPTS: Receipt[] = [
  {
    Icon: FileCheck2,
    headline: '15 scripts generated',
    body: 'zero banned-phrase violations across 3 modes × 5 variants. raw outputs + JSON metadata committed to the repo.',
    link: `${REPO}/tree/main/experiments/01-script-generation/outputs`,
    linkLabel: 'view outputs',
  },
  {
    Icon: FlaskConical,
    headline: '3 modes × 5 variants',
    body: 'tested to validate prompt generalization. honest verdict on which variant won per mode, with what worked and what didn\'t.',
    link: `${REPO}/blob/main/experiments/01-script-generation/verdict.md`,
    linkLabel: 'view verdict',
  },
  {
    Icon: Bed,
    headline: 'morning test on real groggy human',
    body: 'kartik tested 3 winning rituals on himself at 6am, scored honestly on three axes. n=1 but real. results committed before 7am.',
    link: `${REPO}/blob/main/experiments/03-morning-test/results.md`,
    linkLabel: 'view results',
  },
  {
    Icon: GitBranch,
    headline: 'built in 48 hours',
    body: 'engine + 15 scripts + 3 audio rituals + spec + roadmap + this web demo. full build trail in daily logs.',
    link: `${REPO}/tree/main/daily`,
    linkLabel: 'view daily logs',
  },
];

export default function EngineeringProof() {
  return (
    <section id="receipts" className="relative w-full py-24 md:py-32 bg-bg-raised/30">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <SectionHeader
          caption="07 — receipts"
          headline="what's been built. what's been tested."
          body={
            <>
              oath isn&apos;t a pitch deck. the engine is on github, the morning test ran on me at 6am with the same
              ritual you just heard, and the full experiment log is public.
            </>
          }
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {RECEIPTS.map((r, i) => (
            <motion.a
              key={r.headline}
              href={r.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className="group rounded-2xl border border-fg-dim/50 bg-bg-raised p-6 md:p-7 hover:border-amber/40 transition-colors block"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-glow border border-amber/30 flex items-center justify-center text-amber shrink-0">
                  <r.Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[1.0625rem] font-semibold leading-tight">{r.headline}</div>
                  <p className="mt-2 text-[0.875rem] text-fg-muted leading-relaxed">{r.body}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] text-amber group-hover:gap-2.5 transition-all">
                    {r.linkLabel}
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
