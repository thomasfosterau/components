<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Link from '../../lib/ui/Link.svelte';

  const { Story } = defineMeta({
    title: 'UI/Link',
    component: Link,
    parameters: {
      docs: {
        description: {
          component:
            'The in-text anchor, in three weights. `href` resolves through the components context unless the link is external.',
        },
      },
    },
  });
</script>

<Story name="Variants">
  <p class="text-base-content max-w-prose">
    A <Link href="/taxa/rosa">primary link</Link> carries the brand colour, a
    <Link href="/taxa/rosa" variant="muted">muted link</Link> inherits the surrounding text, and a
    <Link href="/taxa/rosa" variant="plain">plain link</Link> recedes further still — for a row of
    metadata where every value happens to be addressable.
  </p>
</Story>

<Story name="External">
  <p class="text-base-content max-w-prose">
    The record is mirrored at <Link href="https://example.org/records/42" external>example.org</Link
    >, which opens in a new tab.
  </p>
</Story>
