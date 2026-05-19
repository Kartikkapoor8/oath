'use client';

import { motion } from 'framer-motion';
import { Calendar, Activity, UserSearch, BookOpen } from 'lucide-react';
import SectionHeader from './SectionHeader';

interface Card {
  badge: string;
  weeks: string;
  title: string;
  body: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CARDS: Card[] = [
  {
    badge: 'v1.1',
    weeks: 'buildable in: 2-3 weeks',
    title: 'calendar sync',
    body:
      'oath reads tomorrow\'s calendar and surfaces your hardest meeting or deepest work block as a suggested intent. confirm or override with one tap. the engine generates a ritual specifically tuned to that meeting or task. removes the friction of typing intent at night.',
    Icon: Calendar,
  },
  {
    badge: 'v1.2',
    weeks: 'buildable in: 3-4 weeks',
    title: 'health integration',
    body:
      'sleep quality data from apple health adjusts the ritual\'s energy level. slept 4 hours? the ritual is gentler, the voice softer. slept 8 hours? full force, no excuses. the ritual matches your physical state, not just your goals.',
    Icon: Activity,
  },
  {
    badge: 'v2',
    weeks: 'buildable in: 6-8 weeks',
    title: 'passive profile',
    body:
      'opt-in connection to your public instagram or tiktok. the engine analyzes which creators, athletes, and characters you engage with and surfaces them as suggested heroes. watched 40 hours of suits? harvey specter becomes a suggested hero archetype. zero manual input.',
    Icon: UserSearch,
  },
  {
    badge: 'v2',
    weeks: 'buildable in: 8-12 weeks',
    title: 'hero corpus',
    body:
      '50-100 sourced, fact-checked anecdotes from documented hero habits — jordan\'s pre-dawn shootarounds, kobe\'s mamba mentality routines, churchill\'s dictation walks. the engine references verified specifics instead of relying on LLM general knowledge, eliminating hallucination risk.',
    Icon: BookOpen,
  },
];

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="relative w-full py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <SectionHeader
          caption="06 — roadmap"
          headline="what comes after v1 ships."
          body={
            <>
              v1 ships the audio loop and proves whether the ritual changes behavior. these integrations make oath more
              personal, more passive, and more defensible. all of them are buildable within weeks of v1 launch —
              they&apos;re scoped, not vaporware.
            </>
          }
        />

        <div className="mt-12 grid md:grid-cols-2 gap-5 md:gap-6">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className="relative rounded-2xl border border-future/30 bg-future-glow p-6 md:p-8 group hover:border-future/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-11 h-11 rounded-xl bg-future/15 border border-future/30 flex items-center justify-center text-future">
                  <c.Icon size={20} />
                </div>
                <div className="font-mono text-[0.7rem] tracking-wider uppercase text-future-bright px-2.5 py-1 rounded-md border border-future/40">
                  {c.badge}
                </div>
              </div>
              <h3 className="mt-5 text-[1.375rem] font-semibold leading-tight">{c.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-[1.65] text-fg-muted">{c.body}</p>
              <div className="mt-5 pt-4 border-t border-future/20 font-mono text-[0.7rem] tracking-wider uppercase text-future-bright/80">
                {c.weeks}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
