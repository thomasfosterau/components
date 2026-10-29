<!-- A formatting toolbar (buttons, a toggle set, a separator, a link) and a
     ButtonGroup, with a context whose href prefixes `/app`. -->
<script lang="ts">
  import { setComponentsContext } from '../../../src/lib/context.svelte.ts';
  import Button from '../../../src/lib/ui/Button.svelte';
  import ButtonGroup from '../../../src/lib/ui/ButtonGroup.svelte';
  import Toolbar from '../../../src/lib/ui/Toolbar.svelte';
  import ToolbarButton from '../../../src/lib/ui/ToolbarButton.svelte';
  import ToolbarLink from '../../../src/lib/ui/ToolbarLink.svelte';
  import ToolbarSeparator from '../../../src/lib/ui/ToolbarSeparator.svelte';
  import ToolbarToggleGroup from '../../../src/lib/ui/ToolbarToggleGroup.svelte';

  interface Props {
    orientation?: 'horizontal' | 'vertical' | undefined;
  }

  let { orientation }: Props = $props();
  setComponentsContext({ href: (path) => `/app${path}` });

  let styles = $state<readonly string[]>([]);
  let align = $state<string>('left');
</script>

<button type="button">Before</button>
<Toolbar label="Formatting" {orientation} data-testid="toolbar">
  <ToolbarButton iconOnly>Undo</ToolbarButton>
  <ToolbarSeparator toolbarOrientation={orientation} />
  <ToolbarToggleGroup
    type="multiple"
    label="Text style"
    items={[
      { value: 'bold', label: 'Bold', iconOnly: true },
      { value: 'italic', label: 'Italic' },
    ]}
    bind:value={styles}
  />
  <ToolbarToggleGroup
    type="single"
    label="Alignment"
    required
    items={[
      { value: 'left', label: 'Left' },
      { value: 'centre', label: 'Centre' },
    ]}
    bind:value={align}
  />
  <ToolbarLink href="/help">Help</ToolbarLink>
</Toolbar>
<button type="button">After</button>
<p data-testid="state">{styles.join(',')}|{align}</p>

<ButtonGroup label="Save options">
  <Button class="join-item">Save</Button>
  <Button class="join-item">Save as…</Button>
  <Button class="join-item">Discard</Button>
</ButtonGroup>
