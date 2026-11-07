<!-- @component
A button that copies a value to the clipboard and announces that it worked — or that it did not.
-->
<!--
  CopyButton — writes a string to the clipboard with
  `navigator.clipboard.writeText`, confirms by swapping its icon for a check
  for `resetAfter` ms, and announces the outcome in a polite live region. The
  primitive under "copy link", "copy id", "copy citation" and `CodeBlock`'s
  copy action. A sibling of `ShareButton`, with the same `tone` / `variant` /
  `size` and callbacks rather than rendered errors.

  No bits-ui primitive: there is no interaction here beyond a native button.

  Two decisions, both about what a screen-reader or voice-control user hears:
  - The accessible name NEVER changes. It is `label` throughout, and the
    visible text stays `label` too (a visible "Copied" would either change
    the name under focus, which is announced inconsistently and breaks voice
    control, or diverge from it, which fails WCAG 2.5.3 label-in-name). The
    copied state is shown by the icon and SPOKEN by a sibling
    `role="status"` (polite), which is emptied after `resetAfter` so a second
    copy is announced again.
  - The clipboard API is read in the click handler, never during render, so
    SSR output is identical. Where it is missing (an insecure context, some
    embedded webviews) the button still renders — copy is expected to be
    there — and a click announces `failedLabel` and calls `onError`. The
    deprecated `document.execCommand('copy')` fallback is not used.
-->
<script lang="ts">
  import { Check, Copy } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import Button from './Button.svelte';
  import type { ButtonVariant, Size, Tone } from './tones.ts';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props extends Omit<HTMLButtonAttributes, 'value' | 'children'> {
    /** The text written to the clipboard; a function is read at click time. */
    value: string | (() => string);
    /**
     * The button's accessible name, and its text unless `iconOnly`.
     * @defaultValue `'Copy'`
     */
    label?: string | undefined;
    /**
     * Announced after a successful copy.
     * @defaultValue `'Copied'`
     */
    copiedLabel?: string | undefined;
    /**
     * Announced after a failed copy.
     * @defaultValue `'Could not copy'`
     */
    failedLabel?: string | undefined;
    /**
     * Show only the icon; `label` stays the accessible name.
     * @defaultValue `false`
     */
    iconOnly?: boolean | undefined;
    /**
     * How long the copied state lasts, in milliseconds.
     * @defaultValue `2000`
     */
    resetAfter?: number | undefined;
    /** Semantic colour. */
    tone?: Tone | undefined;
    /**
     * daisyUI button style.
     * @defaultValue `'ghost'`
     */
    variant?: ButtonVariant | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'sm'`
     */
    size?: Size | undefined;
    /** The copy succeeded. */
    onCopy?: ((value: string) => void) | undefined;
    /** The copy failed (no permission, insecure context, API missing). */
    onError?: ((error: unknown) => void) | undefined;
    /** Replaces the icon and label entirely; receives whether a copy just succeeded. */
    children?: Snippet<[boolean]> | undefined;
  }

  let {
    value,
    label = 'Copy',
    copiedLabel = 'Copied',
    failedLabel = 'Could not copy',
    iconOnly = false,
    resetAfter = 2000,
    tone,
    variant = 'ghost',
    size = 'sm',
    onCopy,
    onError,
    children,
    class: className,
    ...rest
  }: Props = $props();

  let copied = $state(false);
  let status = $state('');
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** Show `message` (and, on success, the check) until `resetAfter` passes. */
  const report = (message: string, success: boolean): void => {
    clearTimeout(timer);
    copied = success;
    status = message;
    timer = setTimeout(() => {
      copied = false;
      status = '';
    }, resetAfter);
  };

  $effect(() => () => {
    clearTimeout(timer);
  });

  const copy = async (): Promise<void> => {
    const text = typeof value === 'function' ? value() : value;
    try {
      if (typeof navigator === 'undefined' || navigator.clipboard === undefined) {
        throw new Error('The clipboard is not available here.');
      }
      await navigator.clipboard.writeText(text);
      report(copiedLabel, true);
      onCopy?.(text);
    } catch (error) {
      report(failedLabel, false);
      onError?.(error);
    }
  };
</script>

<Button
  {...rest}
  {tone}
  {variant}
  {size}
  class={[iconOnly && 'btn-square', className]}
  onclick={() => {
    void copy();
  }}
>
  {#if children}
    {@render children(copied)}
  {:else}
    {#if copied}
      <Check class="text-success size-4" aria-hidden="true" />
    {:else}
      <Copy class="size-4" aria-hidden="true" />
    {/if}
    {#if iconOnly}<VisuallyHidden>{label}</VisuallyHidden>{:else}{label}{/if}
  {/if}
</Button>
<span role="status" class="sr-only">{status}</span>
