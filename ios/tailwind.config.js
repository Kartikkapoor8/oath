/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0B0F',
          raised: '#13151B',
          elevated: '#1A1D26',
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
        },
        future: {
          DEFAULT: '#6366F1',
          bright: '#A5B4FC',
        },
        success: '#10B981',
        warn: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        display: ['Geist-Bold'],
        body: ['Geist-Regular'],
        bodyMedium: ['Geist-Medium'],
        bodySemibold: ['Geist-SemiBold'],
        mono: ['GeistMono-Regular'],
        monoMedium: ['GeistMono-Medium'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
