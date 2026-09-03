import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Generate 404.html clone of index.html for static SPA routing fallbacks on Vercel
function spaFallbackPlugin() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const dist = path.resolve(import.meta.dirname || process.cwd(), 'dist');
      const indexPath = path.join(dist, 'index.html');
      const fallbackPath = path.join(dist, '404.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, fallbackPath);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
});
