<!-- @component
The segment group `DateField` and `TimeField` share; internal, not exported.
-->
<!--
  SegmentGroup — the `role="group"` of spinbutton segments inside a bits-ui
  `DateField` or `TimeField` root, written once for both. `parts` is the
  bits-ui namespace in use; both expose `Input` and `Segment` with the same
  props.

  `<label for>` cannot name a `role="group"`, so the group is
  `aria-labelledby` the `FormField`'s label (`labelId`), and each segment is
  labelled by its own part name ("day, ") followed by that label, so a
  reader landing on one hears "day, Sown on". bits-ui would name them from
  its own `Label`, which a `FormField` has no use for, so the segments are
  rendered through their `child` snippet with our `aria-labelledby` last.
  The literal separators ("/", ":") are `aria-hidden`: the spinbutton names
  already say which part is which.
-->
<script lang="ts">
  import type { DateField, TimeField } from 'bits-ui';
  import { inputSize } from './field-types.ts';
  import type { SegmentGroupOptions } from './segmented-field.ts';

  interface Props {
    /** The bits-ui namespace whose parts to render. */
    parts: typeof DateField | typeof TimeField;
    group: SegmentGroupOptions;
  }

  let { parts, group }: Props = $props();
  const { class: className, ...attributes } = $derived(group.attributes);
  // SAFETY: the two namespaces' `Segment`s differ only in the `part` union
  // they accept, and every `part` rendered here comes from the same root's
  // own `segments`, so a TimeField segment is only ever handed a time part.
  const Segment = $derived(parts.Segment as typeof DateField.Segment);
</script>

<parts.Input {...group.id === undefined ? {} : { id: group.id }} name={group.name ?? ''}>
  {#snippet child({ props, segments })}
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
      {#each segments as { part, value }, index (index)}
        <Segment {part}>
          {#snippet child({ props: segmentProps })}
            {#if part === 'literal'}
              <span {...segmentProps} aria-hidden="true" class="text-base-content/60 px-px">{value}</span>
            {:else}
              <span
                {...segmentProps}
                aria-labelledby={group.labelId === undefined
                  ? undefined
                  : `${String(segmentProps['id'])} ${group.labelId}`}
                class="focus:bg-primary focus:text-primary-content rounded-sm px-0.5 outline-none aria-[valuetext=Empty]:text-base-content/50"
                >{value}</span
              >
            {/if}
          {/snippet}
        </Segment>
      {/each}
    </div>
  {/snippet}
</parts.Input>
