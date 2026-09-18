<!--
  HotkeyBadge — a hotkey trigger rendered as daisyUI `kbd` chips: ⌘ K for
  `'$mod+k'`, G then P for `['g', 'p']`. Used by the command palette's rows
  and by the hotkey help overlay.

  `$mod` resolves to ⌘ / Ctrl only AFTER hydration. The server cannot know the
  reader's platform, so server-rendered output always shows `controlLabel` and
  a Mac corrects itself on mount; resolving it during render instead would be
  a hydration mismatch on every Mac. That is why `apple` is `$state` written
  from an `$effect` rather than a `$derived`.

  ARIA contract: the chips are `<kbd>` elements, which is the element for user
  input, and the separator between sequential keys is real text
  (`thenLabel`) — not a bare "→" — so "G then P" is announced as an
  instruction rather than as two loose letters. The badge contributes no name
  of its own: it is read as part of the row it labels.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { isApplePlatform, triggerDisplay } from './match.ts';
  import type { HotkeyTrigger } from './types.ts';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /** The trigger to render — a chord (`'$mod+k'`) or a sequence (`['g','p']`). */
    trigger: HotkeyTrigger;
    /** What `$mod` reads as on Apple platforms. */
    commandLabel?: string | undefined;
    /** What `$mod` reads as everywhere else, and during server rendering. */
    controlLabel?: string | undefined;
    /** Read between the keys of a sequence. */
    thenLabel?: string | undefined;
  }

  let {
    trigger,
    commandLabel = '⌘',
    controlLabel = 'Ctrl',
    thenLabel = 'then',
    class: className,
    ...rest
  }: Props = $props();

  const display = $derived(triggerDisplay(trigger));

  // Resolved client-side to avoid an SSR/client hydration mismatch.
  let apple = $state(false);
  $effect(() => {
    apple = isApplePlatform();
  });
  const modLabel = $derived(apple ? commandLabel : controlLabel);
</script>

<span {...rest} class={['inline-flex shrink-0 items-center gap-1', className]}>
  {#each display.keys as key, index (index)}
    {#if index > 0 && display.sequential}
      <span class="text-base-content/50 text-xs">{thenLabel}</span>
    {/if}
    <kbd class="kbd kbd-sm">{key === '$mod' ? modLabel : key}</kbd>
  {/each}
</span>
