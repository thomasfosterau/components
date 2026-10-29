<!-- @component
The segment group the bits-ui date and time controls share; internal, not exported.
-->
<!--
  SegmentGroup — the `role="group"` of spinbutton segments inside a bits-ui
  `DateField`, `TimeField`, `DatePicker` or `DateRangePicker` root, written
  once for all four. `parts` is the bits-ui namespace in use; each exposes
  `Input` and `Segment` (a range's `Input` also takes `type`).

  `<label for>` cannot name a `role="group"`, so the group is
  `aria-labelledby` the `FormField`'s label (`labelId`), and each segment is
  labelled by its own part name ("day, ") followed by that label, so a
  reader landing on one hears "day, Sown on". bits-ui would name them from
  its own `Label`, which a `FormField` has no use for, so the segments are
  rendered through their `child` snippet with our `aria-labelledby` last.
  The literal separators ("/", ":") are `aria-hidden`: the spinbutton names
  already say which part is which.

  Two shapes. By default the group IS the field: the `input` shell, named
  by the label, carrying `describedBy` / `invalid`, with an optional
  `trailing` snippet (the picker's calendar button) inside it. With
  `range`, it is one half of a `DateRangePicker`, whose root draws the
  shell: a bare inline group named by `range.label` ("Start date"), whose
  segments read "day, <label> Start date".
-->
<script lang="ts">
  import type { DateField, DatePicker, DateRangePicker, TimeField } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import { inputSize } from './field-types.ts';
  import type { SegmentGroupOptions } from './segmented-field.ts';

  interface Props {
    /** The bits-ui namespace whose parts to render. */
    parts: typeof DateField | typeof TimeField | typeof DatePicker | typeof DateRangePicker;
    group: SegmentGroupOptions;
    /** One half of a range: which half, its name, and its posted field name. */
    range?: { readonly type: 'start' | 'end'; readonly label: string; readonly name?: string | undefined } | undefined;
    /** Rendered inside the shell after the segments (a picker's trigger). */
    trailing?: Snippet<[]> | undefined;
  }

  let { parts, group, range, trailing }: Props = $props();
  const { class: className, ...attributes } = $derived(group.attributes);
  // SAFETY: the namespaces' `Segment`s differ only in the `part` union they
  // accept, and every `part` rendered here comes from the same root's own
  // `segments`, so a TimeField segment is only ever handed a time part.
  const Segment = $derived(parts.Segment as typeof DateField.Segment);
  // SAFETY: every `Input` takes `id`, `name` and `child`; only the range's
  // also takes `type`, which is passed only when `range` is set, and a range
  // is only ever rendered with `DateRangePicker`'s parts.
  const Input = $derived(parts.Input as typeof DateRangePicker.Input);
  const inputProps = $derived({
    ...(group.id === undefined || range !== undefined ? {} : { id: group.id }),
    name: (range === undefined ? group.name : range.name) ?? '',
    ...(range === undefined ? {} : { type: range.type }),
  } as { type: 'start' | 'end'; name: string });
</script>

{#snippet segmentList(segments: readonly { part: string; value: string }[], names: string | undefined)}
  {#each segments as { part, value }, index (index)}
    <Segment part={part as 'literal'}>
      {#snippet child({ props: segmentProps })}
        {#if part === 'literal'}
          <span {...segmentProps} aria-hidden="true" class="text-base-content/60 px-px">{value}</span>
        {:else}
          <span
            {...segmentProps}
            aria-labelledby={names === undefined ? undefined : `${String(segmentProps['id'])} ${names}`}
            class="focus:bg-primary focus:text-primary-content rounded-sm px-0.5 outline-none aria-[valuetext=Empty]:text-base-content/50"
            >{value}</span
          >
        {/if}
      {/snippet}
    </Segment>
  {/each}
{/snippet}

<Input {...inputProps}>
  {#snippet child({ props, segments })}
    {#if range !== undefined}
      {@const ownId = String(props['id'])}
      <div {...props} role="group" aria-label={range.label} class="inline-flex items-center">
        {@render segmentList(segments, [group.labelId, ownId].filter(Boolean).join(' '))}
      </div>
    {:else}
      <div
        {...attributes}
        {...props}
        aria-labelledby={group.labelId}
        aria-describedby={group.describedBy === '' ? undefined : group.describedBy}
        aria-invalid={group.invalid ? 'true' : undefined}
        class={[
          'input inline-flex w-auto items-center gap-0 tabular-nums',
          inputSize[group.size],
          group.invalid && 'input-error',
          'data-invalid:input-error',
          group.disabled && 'opacity-50',
          className,
        ]}
      >
        {@render segmentList(segments, group.labelId)}
        {@render trailing?.()}
      </div>
    {/if}
  {/snippet}
</Input>
