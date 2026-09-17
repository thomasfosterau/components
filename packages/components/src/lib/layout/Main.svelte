<!--
  Main — the page's content column, and the `<main>` landmark that names it.

  Every app in the survey had a component called `Main` and none of them
  rendered a `<main>`: each one was a `<section>`, because each was mounted
  inside a shell that had already opened the real `<main>`. That is a correct
  thing to want and a bad thing to leave implicit, so the element is a prop.
  `as="main"` is the default because a page that needs a landmark and does not
  get one is the failure that matters; `as="section"` is for the nested case.

  ARIA contract: exactly one `<main>` per rendered page — the landmark a
  screen-reader user jumps to with a single keystroke, and the target of a
  skip link. There must never be two, which is what `as="section"` exists to
  prevent. A `<section>` is a `region` landmark only when it has an accessible
  name, so pass `aria-label`/`aria-labelledby` (spread through `rest`) when
  the nested block is one worth jumping to, and nothing when it is not.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** `main` (the default) or `section` when a `<main>` is already open. */
    as?: 'main' | 'section' | undefined;
    children: Snippet<[]>;
  }

  let { as = 'main', children, class: className, ...rest }: Props = $props();
</script>

<!-- `min-w-0` is the one class worth imposing: a content column is nearly
     always a flex or grid child, and without it a wide table or a long
     unbroken URL inside pushes the whole layout sideways. -->
<svelte:element this={as} {...rest} class={['min-w-0', className]}>
  {@render children()}
</svelte:element>
