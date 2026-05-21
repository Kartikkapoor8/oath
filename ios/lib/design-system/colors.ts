export const colors = {
  bg: {
    DEFAULT: '#0A0B0F',
    raised: '#13151B',
    elevated: '#1A1D26',
    glass: 'rgba(19, 21, 27, 0.8)',
  },
  fg: {
    DEFAULT: '#F5F5F7',
    muted: '#9CA3AF',
    subtle: '#6B7280',
    dim: '#374151',
  },
  amber: {
    DEFAULT: '#F59E0B',
    bright: '#FCD34D',
    dim: '#B45309',
    glow: 'rgba(245, 158, 11, 0.15)',
  },
  future: {
    DEFAULT: '#6366F1',
    bright: '#A5B4FC',
  },
  success: '#10B981',
  warn: '#F59E0B',
  error: '#EF4444',
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    medium: 'rgba(255, 255, 255, 0.1)',
    strong: 'rgba(255, 255, 255, 0.2)',
  },
} as const;

export type ColorToken = typeof colors;
