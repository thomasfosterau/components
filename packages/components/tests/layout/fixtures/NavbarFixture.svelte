<!-- `Navbar` with the four snippet regions, and a bound `menuOpen` mirrored
     into the DOM so a test can see the binding write back.

     The optional regions are declared as top-level snippets and passed as
     PROPS: a `{#snippet}` inside an `{#if}` is a local, not a component
     prop, so the conditional has to be on the value rather than on the
     block. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import Navbar from '../../../src/lib/layout/Navbar.svelte';

  interface Props {
    label?: string;
    menuLabel?: string;
    withMenu?: boolean;
    withRegions?: boolean;
    open?: boolean;
  }

  let {
    label = 'Primary',
    menuLabel = 'Menu',
    withMenu = true,
    withRegions = false,
    open = false,
  }: Props = $props();

  // Seeds the local state once, which is what `untrack` states.
  let menuOpen = $state(untrack(() => open));
</script>

{#snippet center()}<a href="/taxa" data-testid="nav-center">Taxa</a>{/snippet}
{#snippet end()}<button type="button" data-testid="nav-end">Account</button>{/snippet}
{#snippet menu()}
  <nav aria-label="Sections">
    <a href="/gardens" data-testid="nav-menu-link">Gardens</a>
  </nav>
{/snippet}

<p data-testid="open">{menuOpen}</p>

<Navbar
  {label}
  {menuLabel}
  bind:menuOpen
  center={withRegions ? center : undefined}
  end={withRegions ? end : undefined}
  menu={withMenu ? menu : undefined}
>
  {#snippet start()}<a href="/" rel="home" data-testid="nav-start">Gardeneria</a>{/snippet}
</Navbar>
