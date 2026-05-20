'use client';

import { motion } from 'framer-motion';
import { STAGED_TRACE, RUBRIC_META } from '@/lib/trace-data';
import SectionHeader from './SectionHeader';

const AXIS_COUNT = RUBRIC_META.length;
const CHART_SIZE = 360;
const CENTER = CHART_SIZE / 2;
const MAX_RADIUS = CHART_SIZE / 2 - 50; // leave room for axis labels
const RING_LEVELS = 5; // grid rings at 2, 4, 6, 8, 10

function polar(angle: number, r: number) {
  // angle: radians from 12 o'clock going clockwise
  const x = CENTER + r * Math.sin(angle);
  const y = CENTER - r * Math.cos(angle);
  return { x, y };
}

export default function RubricVisualization() {
  const scores = STAGED_TRACE.winning_scores;

  const polygonPoints = RUBRIC_META.map((m, i) => {
    const angle = (i / AXIS_COUNT) * Math.PI * 2;
    const value = scores[m.key];
    const r = (value / 10) * MAX_RADIUS;
    const { x, y } = polar(angle, r);
    return `${x},${y}`;
  }).join(' ');

  return (
    <section id="rubric" className="relative w-full py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <SectionHeader
          caption="04 — evaluation"
          headline="every script scored against six weighted axes."
          body={
            <>
              the critique stage isn&apos;t &quot;looks good.&quot; it&apos;s a structured rubric with six weighted axes, each scored
              1-10 by a claude call. candidates that don&apos;t pass thresholds get refined automatically. this is the
              same kind of evaluation engineering used in production llm systems.
            </>
          }
        />

        <div className="mt-12 grid lg:grid-cols-[auto_1fr] gap-10 lg:gap-16 items-center">
          {/* radar chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto"
          >
            <svg
              viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
              className="w-full max-w-[360px] h-auto"
              role="img"
              aria-label="6-axis rubric radar chart showing winning candidate scores"
            >
              {/* concentric grid rings */}
              {Array.from({ length: RING_LEVELS }, (_, i) => {
                const r = ((i + 1) / RING_LEVELS) * MAX_RADIUS;
                const ringPts = RUBRIC_META.map((_, j) => {
                  const angle = (j / AXIS_COUNT) * Math.PI * 2;
                  const { x, y } = polar(angle, r);
                  return `${x},${y}`;
                }).join(' ');
                return (
                  <polygon
                    key={i}
                    points={ringPts}
                    fill="none"
                    stroke="#374151"
                    strokeWidth="0.75"
                    opacity={0.4 + 0.15 * (i / RING_LEVELS)}
                  />
                );
              })}

              {/* axis lines */}
              {RUBRIC_META.map((_, i) => {
                const angle = (i / AXIS_COUNT) * Math.PI * 2;
                const { x, y } = polar(angle, MAX_RADIUS);
                return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="#374151" strokeWidth="0.75" />;
              })}

              {/* score polygon */}
              <motion.polygon
                points={polygonPoints}
                fill="#F59E0B"
                fillOpacity="0.18"
                stroke="#F59E0B"
                strokeWidth="2"
                initial={{ scale: 0.4, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
              />

              {/* score dots */}
              {RUBRIC_META.map((m, i) => {
                const angle = (i / AXIS_COUNT) * Math.PI * 2;
                const r = (scores[m.key] / 10) * MAX_RADIUS;
                const { x, y } = polar(angle, r);
                return <circle key={m.key} cx={x} cy={y} r="3.5" fill="#FCD34D" />;
              })}

              {/* axis labels */}
              {RUBRIC_META.map((m, i) => {
                const angle = (i / AXIS_COUNT) * Math.PI * 2;
                const labelR = MAX_RADIUS + 26;
                const { x, y } = polar(angle, labelR);
                return (
                  <g key={`label-${m.key}`}>
                    <text
                      x={x}
                      y={y - 6}
                      textAnchor="middle"
                      className="fill-fg-muted"
                      style={{ fontSize: '10px', fontFamily: 'ui-monospace, monospace' }}
                    >
                      {m.label}
                    </text>
                    <text
                      x={x}
                      y={y + 7}
                      textAnchor="middle"
                      className="fill-amber"
                      style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}
                    >
                      {scores[m.key]}/10
                    </text>
                  </g>
                );
              })}
            </svg>
            <p className="mt-2 text-center text-[0.75rem] font-mono text-fg-subtle">
              winning candidate · overall {STAGED_TRACE.winning_overall}/10
            </p>
          </motion.div>

          {/* table */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            <div className="rounded-2xl border border-fg-dim/50 bg-bg-raised overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-5 py-3 border-b border-fg-dim/40 text-[0.7rem] font-mono uppercase tracking-wider text-fg-subtle">
                <div>axis</div>
                <div>weight</div>
                <div>score</div>
              </div>
              {RUBRIC_META.map((m) => (
                <div
                  key={m.key}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 px-5 py-3 border-b border-fg-dim/30 last:border-0 items-center"
                >
                  <div>
                    <div className="text-[0.9375rem] text-fg">{m.label}</div>
                    <div className="text-[0.75rem] text-fg-subtle mt-0.5">{m.what}</div>
                  </div>
                  <div className="font-mono text-[0.8125rem] text-fg-muted">{m.weight.toFixed(1)}×</div>
                  <div className="font-mono text-[0.9375rem] text-amber font-semibold tabular-nums">
                    {scores[m.key]}/10
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* critique notes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="mt-12 rounded-2xl border border-amber/20 bg-amber-glow/30 p-6 md:p-8"
        >
          <div className="caption mb-3 text-amber-dim">critique notes on the winning candidate</div>
          <blockquote className="text-[1.0625rem] leading-relaxed text-fg italic">
            &ldquo;{STAGED_TRACE.winning_critique_notes}&rdquo;
          </blockquote>
          <p className="mt-4 text-[0.8125rem] text-fg-muted">
            the rubric is honest — it caught a real weakness even in the winning candidate. the 8/10 on cliché freedom
            reflects that. inflated scores would produce inflated retries.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
