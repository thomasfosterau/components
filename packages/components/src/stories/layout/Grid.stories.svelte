<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Grid from '../../lib/layout/Grid.svelte';

  const { Story } = defineMeta({ title: 'Layout/Grid', component: Grid });
</script>

<Story name="Cards by minimum width">
  <Grid as="ul" minItem="sm">
    {#each Array.from({ length: 7 }, (_, index) => index + 1) as bed (bed)}
      <li class="card card-border bg-base-100 p-4">Bed {bed}</li>
    {/each}
  </Grid>
</Story>
