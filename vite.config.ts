import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server gives instant HMR — `npm run dev`, edit, see it live. No compile step while developing.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
