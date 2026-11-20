<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ConsentBanner from '../../lib/feedback/ConsentBanner.svelte';
  import ConsentSettings from '../../lib/feedback/ConsentSettings.svelte';
  import { createConsent, type ConsentChoice } from '../../lib/feedback/consent.svelte.ts';
  import Embed from '../../lib/media/Embed.svelte';

  const { Story } = defineMeta({
    title: 'Feedback/ConsentBanner',
    component: ConsentBanner,
    parameters: {
      docs: {
        description: {
          component:
            'A consent banner that asks once: Accept and Reject are the same button, the banner is a plain region (not a dialog), and the confirmation takes focus. `ConsentSettings` is the page where the choice is changed or withdrawn. These stories keep the choice in memory; they write no cookies.',
        },
      },
    },
  });

  const categories = [
    {
      id: 'necessary',
      label: 'Strictly necessary cookies',
      description: 'Keep you signed in and remember this choice.',
      required: true,
    },
    {
      id: 'analytics',
      label: 'Analytics cookies',
      description: 'Tell us which pages are used, so we can improve the planner.',
    },
    { id: 'video', label: 'Video embeds', description: 'Load YouTube videos on guide pages.' },
  ];

  /** An in-memory store: stories must not write real cookies. */
  const memory = (initial?: ConsentChoice) => {
    let stored = initial;
    return createConsent({
      categories,
      read: () => stored,
      write: (choice) => {
        stored = choice;
      },
    });
  };
</script>

<script lang="ts">
  const firstVisit = memory();
  const settings = memory({ analytics: true });
  const gated = memory();
</script>

<Story name="First visit" asChild>
  <ConsentBanner consent={firstVisit} settingsHref="#cookies">
    <p>We’d like to set analytics cookies to understand how you use the garden planner.</p>
    <p>We also use cookies to keep you signed in.</p>
  </ConsentBanner>
  <main class="p-4">
    <p>Page content.</p>
    <button class="btn btn-ghost btn-sm" onclick={() => firstVisit.reset()}>Ask again</button>
  </main>
</Story>

<Story name="Settings page" asChild>
  <div class="max-w-lg">
    <ConsentSettings consent={settings} />
  </div>
</Story>

<Story name="Gating an embed" asChild>
  <div class="flex max-w-lg flex-col gap-4">
    <ConsentSettings consent={gated} title="Video settings" />
    <Embed
      provider="youtube"
      id="dQw4w9WgXcQ"
      title="Planting garlic"
      consent={gated.category('video')}
    />
  </div>
</Story>
