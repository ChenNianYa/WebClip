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
      },
      borderColor:{
        'primary-border':'var(--primary-border)'
      },
      width:{
        'left':'var(--left-element-width)',
        'right':'var(--right-config-width)'
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