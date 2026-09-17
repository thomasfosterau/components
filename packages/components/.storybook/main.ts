import type { StorybookConfig } from '@storybook/sveltekit';

/**
 * Storybook 10 over the SvelteKit framework preset (which is what
 * `svelte-package` libraries use too — it supplies the Svelte 5 + Vite
 * pipeline this package's `vite.config.ts` already configures), plus the
 * Svelte CSF addon so snippet-taking components can be storied in `.svelte`
 * and the a11y addon so every story is audited as it is reviewed.
 */
const config: StorybookConfig = {
  // ONE Storybook for the design system, reaching across into the sibling
  // packages/maps rather than a second install there: two Storybooks for one
  // design system is two review surfaces that can disagree.
  stories: ['../src/**/*.stories.@(ts|svelte)', '../../maps/src/stories/**/*.stories.@(ts|svelte)'],
  addons: ['@storybook/addon-svelte-csf', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/sveltekit',
    options: {},
  },
};

export default config;
