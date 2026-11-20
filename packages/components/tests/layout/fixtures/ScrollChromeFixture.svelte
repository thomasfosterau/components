<!-- A page with a `Navbar` and a `PageHeader` above tall content, for the scroll behaviours. -->
<script lang="ts">
  import Main from '../../../src/lib/layout/Main.svelte';
  import Navbar from '../../../src/lib/layout/Navbar.svelte';
  import PageHeader from '../../../src/lib/layout/PageHeader.svelte';
  import type {
    NavbarScrollBehavior,
    PageHeaderScrollBehavior,
  } from '../../../src/lib/layout/scroll-behavior.ts';

  interface Props {
    navbar?: NavbarScrollBehavior | undefined;
    elevateOnScroll?: boolean | undefined;
    header?: PageHeaderScrollBehavior | undefined;
  }

  let { navbar = 'static', elevateOnScroll, header = 'static' }: Props = $props();
</script>

<Navbar scrollBehavior={navbar} {elevateOnScroll} data-testid="navbar">
  {#snippet start()}<a href="/" rel="home">Garden</a>{/snippet}
</Navbar>
<Main>
  <PageHeader title="Tomato ‘Black Krim’" scrollBehavior={header} collapsedTitle="Black Krim" />
  <div style="height: 4000px"></div>
</Main>
