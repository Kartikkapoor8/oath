'use client';

import { motion } from 'framer-motion';
import PhoneFrame from './PhoneFrame';

const SCROLL_TO = (id: string) => {
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function Hero() {
  return (
    <section id="hero" className="relative w-full min-h-[90vh] md:min-h-screen flex items-center pt-16 pb-16">
      {/* background grain (subtle, helps the dark feel less flat) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-6 md:px-12 grid md:grid-cols-[1.2fr_1fr] gap-12 md:gap-8 items-center">
        {/* left: text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="caption mb-6"
          >
            01 — the wedge
          </motion.div>

          <h1 className="text-[3rem] sm:text-[3.5rem] md:text-[4.5rem] leading-[1] tracking-[-0.04em] font-bold">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="block text-amber"
            >
              OATH
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
              className="block"
            >
              the anti-feed
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
              className="block"
            >
              morning ritual
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
            className="mt-8 max-w-xl text-[1.0625rem] sm:text-[1.125rem] leading-[1.6] text-fg-muted"
          >
            <p>
              generic motivation is everywhere. the problem is the feed wins at the moment your willpower is lowest.
            </p>
            <p className="mt-4">
              oath steals that moment. you swear tomorrow&apos;s hardest task at night. the alarm fires. one ritual plays.
              no scrolling. one button to start.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <button
              onClick={() => SCROLL_TO('staged-demo')}
              className="rounded-full bg-amber text-bg px-6 py-3.5 text-sm font-medium tracking-tight hover:bg-amber-bright transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_25px_-8px_rgba(245,158,11,0.5)]"
            >
              hear the morning test ritual →
            </button>
            <button
              onClick={() => SCROLL_TO('try-your-own')}
              className="rounded-full border border-amber/40 text-amber px-6 py-3.5 text-sm font-medium tracking-tight hover:bg-amber-glow hover:border-amber transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              try your own
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="mt-10 font-mono text-[0.8125rem] text-fg-subtle"
          >
            03 layers of prompt engineering → 5 voice archetypes → 130-200 word ritual → 45-90 second audio
          </motion.div>
        </div>

        {/* right: phone */}
        <div className="flex justify-center md:justify-end">
          <PhoneFrame />
        </div>
      </div>
    </section>
  );
}
