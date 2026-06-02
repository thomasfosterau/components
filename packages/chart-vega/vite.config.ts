import { defineConfig } from 'vite-plus';

export default defineConfig({
  // Library build (vp pack → tsdown).
  pack: {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
  },
});
