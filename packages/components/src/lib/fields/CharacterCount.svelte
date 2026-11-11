<!-- @component
Internal: the "42 / 280" counter under a text field with a `maxlength`, and the polite announcement as the limit nears.
-->
<!--
  CharacterCount — the counter `TextInput` and `Textarea` render under the
  field when `showCount` is on and a `maxlength` is set. Internal: not
  exported from any barrel.

  ARIA contract: the visible count carries `id`, which the field adds to its
  `aria-describedby`, so it is read with the field. A separate
  `aria-live="polite"` region speaks `remainingLabel(left)` only as the reader
  crosses a threshold on the way down — `warnAt`, half of it, and 0 — once per
  crossing, never per keystroke, and says nothing on the way back up. At the
  limit the count turns `text-error`; the number is the information, the
  colour only repeats it.
-->
<script lang="ts">
  import { defaultCountLabel, defaultRemainingLabel, defaultWarnAt } from './affixes.ts';

  interface Props {
    /** Id of the visible count, for the field's `aria-describedby`. */
    id: string;
    /** Characters entered. */
    length: number;
    /** The field's `maxlength`; `undefined` draws nothing. */
    max: number | undefined;
    /** The visible count. */
    countLabel?: ((length: number, max: number) => string) | undefined;
    /** The announcement as the limit nears. */
    remainingLabel?: ((left: number) => string) | undefined;
    /** Characters left at which announcements start; defaults from `max`. */
    warnAt?: number | undefined;
  }

  let {
    id,
    length,
    max: limit,
    countLabel = defaultCountLabel,
    remainingLabel = defaultRemainingLabel,
    warnAt: warnAtProp,
  }: Props = $props();

  const max = $derived(limit ?? 0);
  const warnAt = $derived(warnAtProp ?? defaultWarnAt(max));
  const left = $derived(Math.max(max - length, 0));
  const thresholds = $derived([...new Set([warnAt, Math.floor(warnAt / 2), 0])]);
  const crossed = $derived(thresholds.filter((threshold) => left <= threshold).length);

  let announced = 0;
  let message = $state('');

  $effect(() => {
    if (crossed > announced) message = remainingLabel(left);
    announced = crossed;
  });
</script>

{#if limit !== undefined}
  <div class="mt-1 flex justify-end">
    <span {id} class={['text-xs tabular-nums', left === 0 ? 'text-error' : 'text-base-content/60']}>
      {countLabel(length, max)}
    </span>
    <span class="sr-only" aria-live="polite">{message}</span>
  </div>
{/if}
