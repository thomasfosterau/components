<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Countdown from '../../lib/formatting/Countdown.svelte';
  import Duration from '../../lib/formatting/Duration.svelte';

  const { Story } = defineMeta({
    title: 'Formatting/Duration',
    component: Duration,
    parameters: {
      docs: {
        description: {
          component:
            'A length of time in a `<time datetime="PT…">`, and `Countdown`, the time left until an instant. The countdown reads out coarsely (minutes, then hours), never second by second.',
        },
      },
    },
  });

  // Relative to when the story loads, so the stories never depend on a fixed wall-clock date.
  const loaded = Date.now();
</script>

<Story name="Locales and styles">
  <ul class="space-y-1">
    {#each [['en', 'long'], ['en', 'short'], ['en', 'narrow'], ['en', 'digital'], ['de', 'long'], ['fr', 'short'], ['ja', 'short']] as const as [locale, style] (`${locale}-${style}`)}
      <li><code class="me-2">{locale} {style}</code><Duration value={{ hours: 2, minutes: 30 }} locales={locale} {style} /></li>
    {/each}
  </ul>
</Story>

<Story name="Countdown, digits">
  <Countdown until={loaded + 2 * 24 * 60 * 60_000 + 4 * 60 * 60_000} label="Seed swap opens in" />
</Story>

<Story name="Countdown, text, to zero">
  <Countdown until={loaded + 12_000} label="Watering ends in" display="text" largestUnit="minutes" />
</Story>
