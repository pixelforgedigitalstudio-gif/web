import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { aiScorePlugin } from './vite-plugin-ai-score';

// Vite dev server gives instant HMR — `npm run dev`, edit, see it live. No compile step while developing.
export default defineConfig(({ mode }) => {
  // Load .env so the AI-scoring middleware can read ANTHROPIC_API_KEY server-side.
  // (Vite only exposes VITE_-prefixed vars to the client; this key stays on the server.)
  const env = loadEnv(mode, process.cwd(), '');
  if (env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  }

  return {
    plugins: [react(), aiScorePlugin()],
    server: {
      host: true,
      port: 5173,
    },
  };
});
