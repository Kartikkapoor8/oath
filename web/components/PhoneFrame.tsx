'use client';

import { motion } from 'framer-motion';

// pure-css iphone mockup showing the OATH ritual mid-playback.
// no external images. dark mode, dynamic island, ambient amber glow behind.
export default function PhoneFrame() {
  return (
    <div className="relative w-full flex items-center justify-center py-8">
      {/* ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[420px] h-[420px] rounded-full bg-amber-glow blur-3xl ambient-glow" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        className="relative float-phone"
      >
        {/* outer phone shell */}
        <div className="relative w-[300px] h-[600px] rounded-[52px] bg-gradient-to-b from-zinc-800 via-zinc-900 to-black p-[3px] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.7)]">
          {/* inner bezel */}
          <div className="w-full h-full rounded-[50px] bg-black p-[2px]">
            {/* screen */}
            <div className="relative w-full h-full rounded-[48px] bg-bg overflow-hidden">
              {/* dynamic island */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 rounded-full bg-black z-20" />

              {/* status bar */}
              <div className="absolute top-3 left-0 right-0 flex justify-between px-7 z-10 font-mono text-[10px] text-fg pointer-events-none">
                <span>6:00</span>
                <span className="opacity-0">island</span>
                <span>100%</span>
              </div>

              {/* content */}
              <div className="flex flex-col h-full pt-16 pb-8 px-6">
                {/* top label */}
                <div className="caption text-amber-dim text-center">oath ritual playing</div>

                {/* central ritual moment */}
                <div className="flex-1 flex flex-col items-center justify-center -mt-8">
                  {/* progress ring */}
                  <div className="relative w-44 h-44 mb-8">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none" />
                      <circle
                        cx="50"
                        cy="50"
                        r="46"
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="289"
                        strokeDashoffset="115"
                      />
                    </svg>
                    {/* inner content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <div className="font-mono text-[10px] text-fg-muted tracking-widest uppercase">grounding</div>
                      <div className="text-[1.1rem] mt-1 leading-tight font-medium">
                        trust
                        <br />
                        the work
                      </div>
                      <div className="font-mono text-[10px] text-fg-subtle mt-3 tabular-nums">0:23 / 0:50</div>
                    </div>
                  </div>

                  {/* intent recap */}
                  <div className="text-center text-[0.7rem] text-fg-muted px-4 leading-relaxed">
                    you swore last night:
                    <br />
                    <span className="text-fg italic">"ship the OATH v1 spec before noon"</span>
                  </div>
                </div>

                {/* bottom action button */}
                <div className="mt-auto">
                  <div className="bg-amber rounded-2xl py-3.5 px-5 flex items-center justify-center text-bg font-medium text-sm shadow-[0_6px_20px_-6px_rgba(245,158,11,0.5)]">
                    start: open the spec doc →
                  </div>
                  <div className="mt-3 text-center font-mono text-[10px] text-fg-subtle">
                    no scroll. no swipe. one tap.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* side button accents */}
        <div className="absolute right-[-1px] top-32 w-[2px] h-12 bg-zinc-800 rounded-l" />
        <div className="absolute right-[-1px] top-52 w-[2px] h-20 bg-zinc-800 rounded-l" />
        <div className="absolute left-[-1px] top-32 w-[2px] h-8 bg-zinc-800 rounded-r" />
        <div className="absolute left-[-1px] top-48 w-[2px] h-16 bg-zinc-800 rounded-r" />
      </motion.div>
    </div>
  );
}
