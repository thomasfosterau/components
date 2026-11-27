<!-- @component
A link inside a `Toolbar`: one of its roving-focus controls, resolved through the components context.
-->
<!--
  ToolbarLink — bits-ui `Toolbar.Link`, styled as a small ghost button, with
  `href` resolved through `getComponentsContext().href()` like every other
  link in the library. As a `Toolbar` overflow item it takes the attributes
  `item` is given by spread (`toolbar-stop.ts`).
-->
<script lang="ts">
  import { Toolbar } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import { getToolbarStop, overflowControl } from './toolbar-stop.ts';

  interface Props extends Omit<HTMLAnchorAttributes, 'children'> {
    /** App-relative path, resolved through the context's `href()`. */
    href: string;
    /** The link text; its accessible name. */
    children: Snippet<[]>;
  }

  let { href, children, class: className, ...rest }: Props = $props();

  const context = getComponentsContext();
  const stop = getToolbarStop();
</script>

<Toolbar.Link>
  {#snippet child({ props })}
    <a {...rest} {...props} {...overflowControl(stop, rest, props)} href={context.href(href)} class={['btn btn-ghost btn-sm', className]}>
      {@render children()}
    </a>
  {/snippet}
</Toolbar.Link>
