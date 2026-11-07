<!-- @component
Several `Avatar`s overlapped in daisyUI's `avatar-group`, named as a group, with a "+N" count for the rest.
-->
<!--
  AvatarGroup — overlapping avatars ("the four people on this bed"), with a
  "+3" avatar standing for those not drawn.

  ARIA contract: `role="group"` named by `label`. The children keep their
  own naming (a named `Avatar` is an `img`; a decorative one is hidden). The
  "+N" avatar is `role="img"` named by `overflowLabel(N)` ("3 more"), its
  visible "+3" hidden so the count is not read as "plus three".
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { avatarShape, avatarSize, type AvatarShape, type Size } from './tones.ts';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The group's accessible name, e.g. `'Bed 4 volunteers'`. */
    label: string;
    /** How many more there are than the avatars drawn; shows a "+N" avatar. */
    overflow?: number | undefined;
    /**
     * The "+N" avatar's accessible name.
     * @defaultValue `"<count> more"`
     */
    overflowLabel?: ((count: number) => string) | undefined;
    /**
     * Size step of the "+N" avatar; match the children's.
     * @defaultValue `'md'`
     */
    size?: Size | undefined;
    /**
     * Shape of the "+N" avatar; match the children's.
     * @defaultValue `'circle'`
     */
    shape?: AvatarShape | undefined;
    /** The `Avatar`s. */
    children: Snippet<[]>;
  }

  let {
    label,
    overflow,
    overflowLabel = (count) => `${count} more`,
    size = 'md',
    shape = 'circle',
    class: className,
    children,
    ...rest
  }: Props = $props();
</script>

<div {...rest} role="group" aria-label={label} class={['avatar-group -space-x-4', className]}>
  {@render children()}
  {#if overflow !== undefined && overflow > 0}
    <span role="img" aria-label={overflowLabel(overflow)} class="avatar avatar-placeholder">
      <span
        class={[
          'bg-neutral text-neutral-content inline-flex items-center justify-center',
          avatarSize[size],
          avatarShape[shape],
        ]}
      >
        <span aria-hidden="true">+{overflow}</span>
      </span>
    </span>
  {/if}
</div>
