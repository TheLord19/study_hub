/** Colours are CSS variables so light and dark are one token set, swapped
 *  on :root[data-theme]. Tailwind only ever names the variable. */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ground:   v('--c-ground'),
        surface:  v('--c-surface'),
        raised:   v('--c-raised'),
        line:     v('--c-line'),
        lineSoft: v('--c-line-soft'),
        ink:      v('--c-ink'),
        ink2:     v('--c-ink-2'),
        ink3:     v('--c-ink-3'),
        accent:   v('--c-accent'),
        accentSoft: v('--c-accent-soft'),
        onAccent: v('--c-on-accent'),
        solo:     v('--c-solo'),
        hint:     v('--c-hint'),
        edtl:     v('--c-edtl'),
        cfGray:   v('--c-cf-gray'),
        cfGreen:  v('--c-cf-green'),
        cfCyan:   v('--c-cf-cyan'),
        cfBlue:   v('--c-cf-blue'),
        cfPurple: v('--c-cf-purple'),
        cfOrange: v('--c-cf-orange'),
        cfRed:    v('--c-cf-red')
      },
      fontFamily: {
        sans: ['Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace']
      },
      fontSize: {
        '2xs': ['10.5px', { lineHeight: '1.35' }]
      },
      borderRadius: { DEFAULT: '3px', sm: '2px', md: '4px' },
      maxWidth: { shell: '1180px' }
    }
  },
  plugins: []
};
