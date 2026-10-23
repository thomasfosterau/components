<!-- @component
A labelled navigation list: a `<nav>` landmark around a daisyUI `menu` of `MenuItem` links.
-->
<!--
  Menu — site navigation: a `<nav>` landmark around a `<ul class="menu">` of
  links, where the current page marks itself with `aria-current="page"`.
  Links, list, landmark — no widget, no roving focus, no Escape. Everything
  stays reachable with nothing but Tab, which is the correct behaviour for
  navigation and the wrong behaviour for a menu.

  An application menu behind a trigger is `DropdownMenu`, which takes the
  same `MenuItem`s. The two are separate components so this one imports
  nothing from bits-ui: a page that only navigates (`Sidebar` included) never
  loads the dropdown runtime (#129).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Accessible name of the navigation landmark. */
    label: string;
    /** Extra classes on the `<ul class="menu">`. */
    class?: string | undefined;
    /** The `MenuItem`s. */
    children: Snippet<[]>;
  }

  let { label, class: className, children }: Props = $props();
</script>

<nav aria-label={label}>
  <ul class={['menu w-full gap-1 p-0', className]}>
    {@render children()}
  </ul>
</nav>
