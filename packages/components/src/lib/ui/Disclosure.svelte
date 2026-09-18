<!--
  Disclosure — a native `<details>` wearing daisyUI's `collapse`.

  Hand-rolled disclosure is one of the most commonly broken widgets on the
  web, and it does not need to be built: `<details>`/`<summary>` already give
  a focusable trigger, the expanded/collapsed state, keyboard activation and
  — on a modern browser — find-in-page inside the collapsed content, which no
  JavaScript implementation matches. So this is NOT on bits-ui: there is
  nothing for a primitive to add.

  ARIA contract: the platform's. `<summary>` is the button, `open` is the
  state, and no `aria-expanded` is written by hand (the browser maps it, and
  a second copy can only be wrong). `open` is bindable, so a caller can drive
  the state, and the four apps' "open this section because its form failed"
  case is a one-line binding.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { collapseVariant, type DisclosureVariant } from './tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDetailsElement>, 'title'> {
    /** Whether the section is expanded. Bindable. */
    open?: boolean | undefined;
    /** The summary — its own text, or a snippet for richer markup. */
    title: string | Snippet<[]>;
    variant?: DisclosureVariant | undefined;
    /** Extra classes on the `collapse-content` wrapper. */
    contentClass?: string | undefined;
    children: Snippet<[]>;
  }

  let {
    open = $bindable(false),
    title,
    variant = 'arrow',
    contentClass,
    children,
    class: className,
    ...rest
  }: Props = $props();
</script>

<details
  {...rest}
  bind:open
  class={['collapse border-base-300 bg-base-100 border', collapseVariant[variant], className]}
>
  <summary class="collapse-title font-medium">
    {#if typeof title === 'string'}
      {title}
    {:else}
      {@render title()}
    {/if}
  </summary>
  <div class={['collapse-content', contentClass]}>
    {@render children()}
  </div>
</details>
