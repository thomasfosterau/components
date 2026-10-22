// Svelte config for `svelte-package` (the `/svelte` entry), `svelte-check` and
// the vite-plugin-svelte compile step in the Node suite. Same as the Svelte
// packages': a library still needs this file even though a kit v3 app does not.
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: [vitePreprocess({ script: true })],
};
