/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,js,vue,ts}",
  ],
  theme: {
    extend: {
      colors:{
        'primary-1':'var(--primary-1)',
        'clip-cut-area-color':'var(--clip-cut-area-color)'
      },
      borderColor:{
        'primary-border':'var(--primary-border)'
      },
      width:{
        'left':'calc(var(--left-element-width)*1px)',
        'right':'calc(var(--right-config-width)*1px)'
      },
      height:{
        'control':'var(--control-height)',
        'track':'var(--track-height)',
      },
      textColor:{
        
      }
    },
  },
  plugins: [],
}