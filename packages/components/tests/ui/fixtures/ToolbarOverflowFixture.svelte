<!-- Test fixture: an overflowing Toolbar and ButtonGroup of 80px controls in a frame whose width the test sets. -->
<script lang="ts">
  import Button from '../../../src/lib/ui/Button.svelte';
  import ButtonGroup from '../../../src/lib/ui/ButtonGroup.svelte';
  import Toolbar from '../../../src/lib/ui/Toolbar.svelte';
  import ToolbarButton from '../../../src/lib/ui/ToolbarButton.svelte';
  import ToolbarLink from '../../../src/lib/ui/ToolbarLink.svelte';

  interface Props {
    width?: number | undefined;
  }

  let { width = 300 }: Props = $props();

  let pressed = $state('');

  const actions = Array.from({ length: 6 }, (_, i) => ({
    id: `action-${i + 1}`,
    label: `Action ${i + 1}`,
    onSelect: () => (pressed = `Action ${i + 1}`),
    ...(i === 1 ? { href: '/help' } : {}),
  }));

  const fixed = (style: string | undefined): string => `${style ?? ''} width: 80px; padding: 0; margin: 0;`;
</script>

<button type="button">Before</button>
<div style="width: {width}px;">
  <Toolbar label="Actions" items={actions} overflow style="display: flex; gap: 0; padding: 0;">
    {#snippet item(action, _index, attributes)}
      {#if action.href === undefined}
        <ToolbarButton {...attributes} style={fixed(attributes.style)} onclick={action.onSelect}>{action.label}</ToolbarButton>
      {:else}
        <ToolbarLink {...attributes} href={action.href} style={fixed(attributes.style)}>{action.label}</ToolbarLink>
      {/if}
    {/snippet}
  </Toolbar>
</div>
<button type="button">After</button>
<p data-testid="pressed">{pressed}</p>

<div style="width: {width}px;">
  <ButtonGroup label="Save options" items={actions} overflow style="gap: 0; padding: 0;">
    {#snippet item(action, _index, attributes)}
      <Button {...attributes} class="join-item" style={fixed(attributes.style)}>{action.label}</Button>
    {/snippet}
  </ButtonGroup>
</div>
