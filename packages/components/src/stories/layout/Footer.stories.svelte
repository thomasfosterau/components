<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Footer from '../../lib/layout/Footer.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Footer',
    component: Footer,
    parameters: {
      docs: {
        description: {
          component:
            'The `contentinfo` landmark at the bottom of every page — the one a reader jumps to for the small print. The columns are the app’s, typically `<nav>` blocks with a `footer-title` heading each; `aside` is the brand and attribution block, rendered first.',
        },
      },
    },
  });
</script>

<Story name="Columns">
  <Footer>
    <nav>
      <h2 class="footer-title">Browse</h2>
      <a href="/gardens" class="link link-hover">Gardens</a>
      <a href="/taxa" class="link link-hover">Taxa</a>
      <a href="/posts" class="link link-hover">Posts</a>
    </nav>
    <nav>
      <h2 class="footer-title">About</h2>
      <a href="/about" class="link link-hover">This project</a>
      <a href="/privacy" class="link link-hover">Privacy</a>
    </nav>
  </Footer>
</Story>

<Story name="With an attribution block">
  <Footer>
    {#snippet aside()}
      <p class="max-w-xs text-sm leading-6">
        Occurrence data under CC BY 4.0.
      </p>
    {/snippet}
    <nav>
      <h2 class="footer-title">Browse</h2>
      <a href="/gardens" class="link link-hover">Gardens</a>
      <a href="/taxa" class="link link-hover">Taxa</a>
    </nav>
  </Footer>
</Story>
