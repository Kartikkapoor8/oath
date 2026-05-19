'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import SectionHeader from './SectionHeader';
import AudioPlayer from './AudioPlayer';
import { VOICE_PRESETS, VOICE_DISCLAIMER } from '@/lib/voice-presets';

export default function VoicePresets() {
  return (
    <section id="voices" className="relative w-full py-24 md:py-32 bg-bg-raised/30">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <SectionHeader
          caption="05 — voice archetypes"
          headline="five voices. choose the energy that gets you out of bed."
          body={
            <>
              five distinct voice archetypes mapped to elevenlabs production voices. each archetype references a
              cultural touchpoint to make the energy immediately recognizable.
            </>
          }
        />

        {/* disclaimer banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex items-start gap-3 rounded-xl border border-fg-dim/40 bg-bg-raised px-5 py-4 max-w-3xl"
        >
          <Info size={16} className="shrink-0 mt-0.5 text-amber-dim" />
          <p className="text-[0.8125rem] text-fg-muted leading-relaxed">{VOICE_DISCLAIMER}</p>
        </motion.div>

        {/* grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {VOICE_PRESETS.map((preset, i) => (
            <motion.div
              key={preset.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className="rounded-2xl border border-fg-dim/50 bg-bg-raised p-6 hover:border-amber/40 transition-colors"
            >
              <div className="font-mono text-[0.65rem] text-amber-dim tracking-[0.2em] uppercase mb-2">
                voice {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-[1.25rem] font-semibold leading-tight">{preset.label}</h3>
              <p className="mt-1 text-[0.8125rem] text-amber-bright/80">{preset.reference}</p>
              <p className="mt-3 text-[0.875rem] text-fg-muted leading-relaxed">{preset.description}</p>
              <div className="mt-5 pt-5 border-t border-fg-dim/30">
                <AudioPlayer
                  src={preset.sampleFile}
                  downloadName={`oath-${preset.key}.mp3`}
                  size="sm"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
