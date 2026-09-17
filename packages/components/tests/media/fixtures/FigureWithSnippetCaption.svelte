<!-- Test fixture: a Figure whose caption is a snippet, not a string — exercises the branch createRawSnippet can't reach on its own since Figure needs two independent snippets (caption and children). -->
<script lang="ts">
  import Figure from '../../../src/lib/media/Figure.svelte';
</script>

<Figure>
  {#snippet caption()}
    Photo: <em>Thomas Foster</em>
  {/snippet}
  <img src="https://example.com/garden.jpg" alt="A garden bed" />
</Figure>
