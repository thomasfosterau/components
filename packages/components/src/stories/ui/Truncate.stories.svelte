<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Truncate from '../../lib/ui/Truncate.svelte';

  const files = [
    'IMG_20241012_153045_0412.jpg',
    'garden-plan-final-final-v3.geojson',
    'notes.md',
    '~/garden/2024/autumn/plans/beds.geojson',
  ];

  const { Story } = defineMeta({
    title: 'UI/Truncate',
    component: Truncate,
    parameters: {
      docs: {
        description: {
          component:
            'One line that may not fit, cut at the end, the start or the middle, keeping the full text for screen readers and copying, with a tooltip only while it is cut. Resize the frame to see it re-cut.',
        },
      },
    },
  });
</script>

<Story name="File names in a table" asChild>
  <table class="table w-72 table-fixed">
    <thead><tr><th>File</th><th class="w-16">Size</th></tr></thead>
    <tbody>
      {#each files as file (file)}
        <tr>
          <td><a class="link" href="#{file}"><Truncate text={file} position="middle" /></a></td>
          <td>2 MB</td>
        </tr>
      {/each}
    </tbody>
  </table>
</Story>

<Story name="End, start and middle" asChild>
  <div class="w-56 space-y-2 p-4">
    <Truncate text="Solanum lycopersicum 'Black Krim' (heirloom)" />
    <Truncate text="feature/garden-beds-map-and-legend" position="start" mono />
    <Truncate text="~/garden/2024/autumn/plans/beds.geojson" position="middle" mono />
  </div>
</Story>

<Story name="Branch name" asChild>
  <span class="badge badge-ghost max-w-48">
    <Truncate text="feature/import-mapper-csv-preview" position="middle" mono maxWidth="xs" />
  </span>
</Story>
