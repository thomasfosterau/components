<!-- @component
What `ConsentBanner` shows once the reader chooses: the outcome, a settings link and Hide; internal, not exported.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Button from '../ui/Button.svelte';
  import Link from '../ui/Link.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
    title: string;
    accepted: boolean;
    message: string;
    settingsHref: string | undefined;
    changeLabel: string;
    hideLabel: string;
    hide: () => void;
    confirmation: Snippet<[{ accepted: boolean; hide: () => void }]> | undefined;
  }

  let {
    title,
    accepted,
    message,
    settingsHref,
    changeLabel,
    hideLabel,
    hide,
    confirmation,
    class: className,
    ...rest
  }: Props = $props();

  const titleId = $props.id();

  /** The outcome is read because focus lands on it. */
  const takeFocus = (node: HTMLElement): void => {
    node.focus();
  };
</script>

<section
  {...rest}
  class={['bg-base-200 p-4', className]}
  aria-labelledby={titleId}
  tabindex="-1"
  {@attach takeFocus}
>
  <h2 id={titleId} class="sr-only">{title}</h2>
  <div class="mx-auto flex max-w-5xl flex-col gap-3">
    {#if confirmation}
      {@render confirmation({ accepted, hide })}
    {:else}
      <p>
        {message}
        {#if settingsHref !== undefined}
          <Link href={settingsHref}>{changeLabel}</Link>
        {/if}
      </p>
    {/if}
    <div><Button variant="outline" onclick={hide}>{hideLabel}</Button></div>
  </div>
</section>
