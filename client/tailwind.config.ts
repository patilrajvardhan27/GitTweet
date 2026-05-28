import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          elevated: 'var(--color-bg-elevated)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
        },
        text: {
          1: 'var(--color-text-1)',
          2: 'var(--color-text-2)',
          3: 'var(--color-text-3)',
        },
        green: {
          DEFAULT: 'var(--color-green)',
          bg: 'var(--color-green-bg)',
          border: 'var(--color-green-border)',
        },
        blue: {
          DEFAULT: 'var(--color-blue)',
          bg: 'var(--color-blue-bg)',
        },
        red: {
          DEFAULT: 'var(--color-red)',
          bg: 'var(--color-red-bg)',
        },
        amber: {
          DEFAULT: 'var(--color-amber)',
          bg: 'var(--color-amber-bg)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
};

export default config;
