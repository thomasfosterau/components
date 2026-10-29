<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { AlignCenter, AlignLeft, Bold, Hand, Italic, MousePointer2, Pencil, Undo2 } from '@lucide/svelte';
  import Button from '../../lib/ui/Button.svelte';
  import ButtonGroup from '../../lib/ui/ButtonGroup.svelte';
  import Toolbar from '../../lib/ui/Toolbar.svelte';
  import ToolbarButton from '../../lib/ui/ToolbarButton.svelte';
  import ToolbarLink from '../../lib/ui/ToolbarLink.svelte';
  import ToolbarSeparator from '../../lib/ui/ToolbarSeparator.svelte';
  import ToolbarToggleGroup from '../../lib/ui/ToolbarToggleGroup.svelte';

  const { Story } = defineMeta({
    title: 'UI/Toolbar',
    component: Toolbar,
    parameters: {
      docs: {
        description: {
          component:
            'A `Toolbar` is one Tab stop with arrow keys across all its controls (APG toolbar). A `ButtonGroup` is a named cluster whose buttons each stay a Tab stop: use it for independent actions such as "Save | Save as… | Discard".',
        },
      },
    },
  });
</script>

{#snippet undo()}<Undo2 class="size-4" aria-hidden="true" />{/snippet}
{#snippet bold()}<Bold class="size-4" aria-hidden="true" />{/snippet}
{#snippet italic()}<Italic class="size-4" aria-hidden="true" />{/snippet}
{#snippet left()}<AlignLeft class="size-4" aria-hidden="true" />{/snippet}
{#snippet centre()}<AlignCenter class="size-4" aria-hidden="true" />{/snippet}
{#snippet pointer()}<MousePointer2 class="size-4" aria-hidden="true" />{/snippet}
{#snippet pen()}<Pencil class="size-4" aria-hidden="true" />{/snippet}
{#snippet pan()}<Hand class="size-4" aria-hidden="true" />{/snippet}

<Story name="Formatting toolbar">
  <Toolbar label="Formatting">
    <ToolbarButton iconOnly icon={undo}>Undo</ToolbarButton>
    <ToolbarSeparator />
    <ToolbarToggleGroup
      type="multiple"
      label="Text style"
      items={[
        { value: 'bold', label: 'Bold', icon: bold, iconOnly: true },
        { value: 'italic', label: 'Italic', icon: italic, iconOnly: true },
      ]}
    />
    <ToolbarSeparator />
    <ToolbarToggleGroup
      type="single"
      label="Alignment"
      value="left"
      required
      items={[
        { value: 'left', label: 'Align left', icon: left, iconOnly: true },
        { value: 'centre', label: 'Centre', icon: centre, iconOnly: true },
      ]}
    />
    <ToolbarSeparator />
    <ToolbarLink href="/help/formatting">Help</ToolbarLink>
  </Toolbar>
</Story>

<Story name="Vertical canvas palette">
  <Toolbar label="Tools" orientation="vertical">
    <ToolbarToggleGroup
      type="single"
      label="Tool"
      value="select"
      required
      items={[
        { value: 'select', label: 'Select', icon: pointer, iconOnly: true },
        { value: 'draw', label: 'Draw', icon: pen, iconOnly: true },
        { value: 'pan', label: 'Pan', icon: pan, iconOnly: true },
      ]}
      class="flex-col"
    />
  </Toolbar>
</Story>

<Story name="ButtonGroup on a form">
  <ButtonGroup label="Save options">
    <Button class="join-item" tone="primary">Save</Button>
    <Button class="join-item">Save as…</Button>
    <Button class="join-item" variant="outline" tone="error">Discard</Button>
  </ButtonGroup>
</Story>
