/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ubuntu Brand Colors - Warm earth tones from mockups
        'ubuntu-brown': '#8B4513',
        'ubuntu-brown-dark': '#654321',
        'ubuntu-brown-light': '#A0522D',
        'ubuntu-orange': '#FF8C00',
        'ubuntu-orange-dark': '#FF6B00',
        'ubuntu-orange-light': '#FFA500',
        'ubuntu-cream': '#FFF8DC',
        'ubuntu-cream-dark': '#F5DEB3',
        'ubuntu-gold': '#DAA520',
        'ubuntu-gold-dark': '#B8860B',
        'ubuntu-beige': '#F5F5DC',
        'ubuntu-tan': '#D2B48C',
        'ubuntu-sienna': '#A0522D',
        
        // Legacy colors for compatibility
        'primary': '#8B4513',
        'primary-dark': '#654321',
        'primary-light': '#A0522D',
        'secondary': '#D2B48C',
        'success': '#228B22',
        'warning': '#FF8C00',
        'warning-dark': '#FF6B00',
        'warning-light': '#FFA500',
        'danger': '#DC143C',
        'info': '#8B4513',
        
        // Backgrounds
        'bg-light': '#FFF8DC',
        'bg-light-secondary': '#F5F5DC',
        'bg-light-tertiary': '#FAEBD7',
        
        // Text
        'text-light': '#2F1B14',
        'text-light-secondary': '#654321',
        'text-light-tertiary': '#8B4513',
        
        // Borders
        'border-light': '#D2B48C',
        'border-light-dark': '#A0522D',
      },
      backgroundColor: {
        'light': '#FFF8DC',
        'light-secondary': '#F5F5DC',
        'light-tertiary': '#FAEBD7',
        'dark': '#2F1B14',
        'dark-secondary': '#654321',
        'dark-tertiary': '#8B4513',
      },
      textColor: {
        'light': '#2F1B14',
        'light-secondary': '#654321',
        'light-tertiary': '#8B4513',
        'dark': '#FFF8DC',
        'dark-secondary': '#F5F5DC',
        'dark-tertiary': '#F5DEB3',
      },
      borderColor: {
        'light': '#D2B48C',
        'light-dark': '#A0522D',
        'dark': '#8B4513',
        'dark-light': '#D2B48C',
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '2.5rem',
        '3xl': '3rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      transitionDuration: {
        '150': '150ms',
        '300': '300ms',
        '500': '500ms',
      },
    },
  },
  plugins: [],
}
