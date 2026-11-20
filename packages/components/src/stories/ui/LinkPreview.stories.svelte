<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Link from '../../lib/ui/Link.svelte';
  import LinkPreview from '../../lib/ui/LinkPreview.svelte';

  const { Story } = defineMeta({
    title: 'UI/LinkPreview',
    component: LinkPreview,
    parameters: {
      docs: {
        description: {
          component:
            'A card of supplementary detail while a link is hovered or keyboard-focused; the link stays a link. The card is not focusable and never shows on touch, so nothing essential or interactive may live only in it: a "Follow" button inside one is unreachable by keyboard, and belongs in a `Popover` instead.',
        },
      },
    },
  });

  interface Taxon {
    readonly common: string;
    readonly summary: string;
  }

  /** A stand-in for a fetch: stories use no network. */
  const loadTaxon = (signal: AbortSignal): Promise<Taxon> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          resolve({
            common: 'Dog rose',
            summary: 'A scrambling wild rose of hedgerows, with pale pink flowers and red hips.',
          }),
        800,
      );
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(signal.reason);
      });
    });
</script>

<Story name="Taxon with load">
  <p class="max-w-prose">
    The hedge is mostly
    <LinkPreview load={loadTaxon}>
      {#snippet trigger({ props })}
        <Link {...props} href="#rosa-canina"><i>Rosa canina</i></Link>
      {/snippet}
      {#snippet children({ data })}
        {#if data}
          <p class="font-semibold">{data.common}</p>
          <p class="text-base-content/70 text-sm">{data.summary}</p>
        {/if}
      {/snippet}
    </LinkPreview>, with some hawthorn.
  </p>
</Story>

<Story name="Static author card">
  <p>
    Written by
    <LinkPreview openDelay={300}>
      {#snippet trigger({ props })}
        <Link {...props} href="#ada">Ada Lovelace</Link>
      {/snippet}
      {#snippet children()}
        <p class="font-semibold">Ada Lovelace</p>
        <p class="text-base-content/70 text-sm">Grows heritage tomatoes on a north-facing allotment.</p>
      {/snippet}
    </LinkPreview>.
  </p>
</Story>
