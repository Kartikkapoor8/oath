'use client';

import { motion } from 'framer-motion';
import { Layers, Activity, AlarmClock, GitCommit, ArrowUpRight } from 'lucide-react';
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
    Icon: Layers,
    headline: '10 pipeline stages',
    body: 'full v2 source code on github. 11 typescript modules in web/lib/oath-engine/, 19 python files in pipeline/v2/.',
    link: `${REPO}/tree/main/pipeline/v2`,
    linkLabel: 'view v2 pipeline source',
  },
  {
    Icon: Activity,
    headline: '8 claude calls per generation',
    body: 'every claude call traced and logged. the experiments/04 run captured all 10 stage outputs as separate json files.',
    link: `${REPO}/blob/main/experiments/04-multi-pass-refinement/final_run.json`,
    linkLabel: 'view pipeline_run.json',
  },
  {
    Icon: AlarmClock,
    headline: 'morning test on a real groggy person',
    body: 'kartik tested 3 winning rituals on himself at 6am, scored on three axes. n=1 but real. results committed before 7am.',
    link: `${REPO}/blob/main/experiments/03-morning-test/results.md`,
    linkLabel: 'view results',
  },
  {
    Icon: GitCommit,
    headline: 'built in 48 hours',
    body: 'engine + v2 pipeline + 15 monday-night scripts + 3 audio rituals + spec + roadmap + this web demo. full trail in daily logs.',
    link: `${REPO}/tree/main/daily`,
    linkLabel: 'view daily logs',
  },
];

export default function EngineeringProof() {
  return (
    <section id="receipts" className="relative w-full py-24 md:py-32 bg-bg-raised/30">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <SectionHeader
          caption="08 — receipts"
          headline="every claim has a github link."
          body={
            <>
              oath isn&apos;t a pitch deck. the v2 engine is on github. the morning test ran on me at 6am with the
              same engine. the full pipeline_run.json from a real generation is public. clone the repo, run the
              engine yourself with your own inputs.
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
