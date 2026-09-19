import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    crx({ manifest }),
  ],
  build: {
    chunkSizeWarningLimit: 700, // CodeMirror 6 bundle is ~612KB minified — expected
  },
});
