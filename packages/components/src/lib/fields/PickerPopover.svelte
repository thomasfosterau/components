<!-- @component
The trigger and calendar popover `DatePicker` and `DateRangePicker` share; internal, not exported.
-->
<!--
  PickerPopover — the calendar button that sits in a picker's shell, and
  the popover it opens. `parts` is `DatePicker` or `DateRangePicker`; both
  expose `Trigger`, `Portal`, `Content` and `Calendar` with the same props,
  and their calendar body is `CalendarMonths`, the same one `Calendar`
  renders inline.

  The trigger is icon-only, so it is named by `triggerLabel` ("Choose
  date"), the glyph `aria-hidden`; bits-ui gives it `aria-haspopup="dialog"`
  and `aria-expanded`. The popover is a `role="dialog"` named by
  `calendarLabel`; bits-ui moves focus into the grid, closes on Escape and
  returns focus to the trigger.
-->
<script lang="ts">
  import { Calendar as CalendarIcon } from '@lucide/svelte';
  import { Portal, type DatePicker, type DateRangePicker } from 'bits-ui';
  import CalendarMonths from './CalendarMonths.svelte';

  interface Props {
    parts: typeof DatePicker | typeof DateRangePicker;
    triggerLabel: string;
    calendarLabel: string;
    months: { readonly locale: string; readonly previousLabel: string; readonly nextLabel: string };
    disabled: boolean;
  }

  let { parts, triggerLabel, calendarLabel, months, disabled }: Props = $props();
  // SAFETY: both namespaces' Trigger / Content / Calendar are the same
  // bits-ui popover and calendar parts under two names. (`DateRangePicker`
  // exports no `Portal`, so the shared utility is used for both.)
  const P = $derived(parts as typeof DatePicker);
</script>

<P.Trigger {disabled}>
  {#snippet child({ props })}
    <button {...props} type="button" class="btn btn-ghost btn-xs btn-square ms-1" aria-label={triggerLabel}>
      <CalendarIcon class="size-4" aria-hidden="true" />
    </button>
  {/snippet}
</P.Trigger>
<Portal>
  <P.Content
    sideOffset={6}
    role="dialog"
    aria-label={calendarLabel}
    class="card card-border bg-base-100 rounded-box z-50 p-3 shadow-md"
  >
    <P.Calendar>
      {#snippet children({ months: grid, weekdays })}
        <CalendarMonths {parts} {...months} months={grid} {weekdays} />
      {/snippet}
    </P.Calendar>
  </P.Content>
</Portal>
