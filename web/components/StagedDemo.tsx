'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import SectionHeader from './SectionHeader';
import AudioPlayer from './AudioPlayer';

// the exact morning test script (hardest_work / default) from monday night's experiment.
// hand-broken into "beats" so we can karaoke-highlight as audio plays.
const SCRIPT_BEATS: string[] = [
  'It is early.',
  'The room is dark.',
  'You are already behind.',
  '',
  'Last night you swore you would ship the OATH v1 spec to GitHub and send Oliver the link before noon.',
  'That was not a wish.',
  'That was a contract.',
  '',
  'Kobe was in the gym at 4am.',
  'Not because the doors opened early.',
  'Because he was already there.',
  'No crowd. No camera. Eight hundred makes before the sun came up.',
  'The work happened before anyone else started their day.',
  '',
  'This is the same.',
  '',
  'Trust the work.',
  '',
  'Sixty minutes. Phone face down.',
  'Open the spec doc.',
  'Write the wedge section.',
  'One section becomes the whole.',
  'The whole becomes the link.',
  'The link goes to Oliver before noon.',
  '',
  'Nothing else exists until the wedge section is done.',
  '',
  'Write.',
];

// total audio duration in seconds (the actual mp3 is ~50s).
const TOTAL_SECONDS = 50;

const INPUTS: Array<[string, string]> = [
  ['mode', 'hardest_work'],
  ['intent', 'ship the OATH v1 spec to github and send Oliver the link before noon'],
  ['first action', 'open the spec doc and write the wedge section'],
  ['hero', 'Kobe Bryant'],
  ['phrase', 'trust the work'],
  ['voice', 'the_closer (calm, authoritative)'],
];

export default function StagedDemo() {
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const handleTime = (current: number) => {
    if (!current || !TOTAL_SECONDS) return setActiveBeat(-1);
    // assign each non-empty beat a proportional slot
    const nonEmpty = SCRIPT_BEATS.map((b, i) => ({ b, i })).filter((x) => x.b.trim().length > 0);
    const idx = Math.min(nonEmpty.length - 1, Math.floor((current / TOTAL_SECONDS) * nonEmpty.length));
    setActiveBeat(nonEmpty[idx]?.i ?? -1);
  };

  return (
    <section id="staged-demo" className="relative w-full py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <SectionHeader
          caption="02 — the morning test"
          headline="this exact ritual played on me at 6am tuesday"
          body={
            <>
              i set my alarm for 6am, phone on the dresser, with my night-before commitment: ship the OATH v1 spec to
              github. at 6am i played this ritual. you can read the inputs and hear what the engine produced.
            </>
          }
        />

        <div className="mt-14 grid md:grid-cols-[1fr_1fr] gap-6 md:gap-10">
          {/* inputs panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-fg-dim/60 bg-bg-raised p-6 md:p-8"
          >
            <div className="caption mb-5 text-amber-dim">the inputs</div>
            <div className="space-y-3">
              {INPUTS.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_1fr] gap-4 items-start py-2 border-b border-fg-dim/40 last:border-0">
                  <div className="font-mono text-[0.75rem] uppercase tracking-[0.08em] text-fg-subtle pt-0.5">
                    {k}
                  </div>
                  <div className="text-[0.9375rem] text-fg leading-snug">{v}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* audio player */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="rounded-2xl border border-fg-dim/60 bg-bg-raised p-6 md:p-8 flex flex-col"
          >
            <div className="caption mb-5 text-amber-dim">the ritual</div>
            <div className="flex-1 flex flex-col justify-center">
              <AudioPlayer
                src="/staged-demo.mp3"
                downloadName="oath-staged-demo.mp3"
                size="lg"
                onTimeUpdate={handleTime}
              />
            </div>
            <div className="mt-5 text-[0.75rem] font-mono text-fg-subtle tracking-wide">
              hardest_work • default • the_closer • 126 words • ~50s
            </div>
          </motion.div>
        </div>

        {/* script as karaoke */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="mt-12 md:mt-16 rounded-2xl border border-fg-dim/40 bg-bg-raised/40 p-8 md:p-12"
        >
          <div className="caption mb-6 text-amber-dim">the script — karaoke highlights as audio plays</div>
          <div className="font-sans text-[1.125rem] md:text-[1.25rem] leading-[1.85] max-w-3xl">
            {SCRIPT_BEATS.map((line, i) => {
              if (line === '') return <div key={i} className="h-3" />;
              const active = i === activeBeat;
              return (
                <p
                  key={i}
                  className={`transition-colors duration-200 ${
                    active ? 'text-amber' : 'text-fg'
                  }`}
                >
                  {line}
                </p>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
