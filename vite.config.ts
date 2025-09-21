import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    port: 3000,
  },
  assetsInclude: ['**/*.glb'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar Three.js y sus dependencias
          'three': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier'],
          // Separar GSAP
          'gsap': ['gsap'],
          // Separar Framer Motion
          'framer': ['framer-motion'],
          // Separar otras librerías grandes
          'utils': ['axios', 'date-fns', 'lottie-react'],
          // React y dependencias core
          'react': ['react', 'react-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei']
  }
})
