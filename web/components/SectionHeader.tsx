'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  caption: string;
  headline: ReactNode;
  body?: ReactNode;
  align?: 'left' | 'center';
}

export default function SectionHeader({ caption, headline, body, align = 'left' }: Props) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : '';
  return (
    <div className={`max-w-3xl ${alignClass}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="caption mb-4"
      >
        {caption}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        className="text-[2rem] md:text-[2.5rem] leading-[1.1] tracking-[-0.025em] font-semibold"
      >
        {headline}
      </motion.h2>
      {body ? (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          className="mt-6 text-[1.0625rem] leading-[1.6] text-fg-muted max-w-2xl"
        >
          {body}
        </motion.p>
      ) : null}
    </div>
  );
}
