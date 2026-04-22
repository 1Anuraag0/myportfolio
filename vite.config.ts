import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    rollupOptions: {
      output: {
        /**
         * PERF: Manual chunk splitting keeps the main bundle lean.
         * - 'three' (~600KB gzipped) loads only when a 3D component renders.
         * - 'gsap' (~40KB) loads separately from application code.
         * - 'vendor' catches remaining node_modules.
         * This prevents the initial JS payload from blocking first paint.
         */
        manualChunks: {
          three: ['three'],
          gsap: ['gsap', 'gsap/ScrollTrigger'],
          vendor: ['react', 'react-dom', '@studio-freight/lenis'],
        },
      },
    },
  },
});
