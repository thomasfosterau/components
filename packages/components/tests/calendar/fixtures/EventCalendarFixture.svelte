<!-- An EventCalendar with the view and date bound, for the tests to read. -->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import EventCalendar from '../../../src/lib/calendar/EventCalendar.svelte';

  type Props = ComponentProps<typeof EventCalendar>;

  let { view = $bindable(), date = $bindable('2026-10-23'), ...props }: Props = $props();
</script>

<EventCalendar {...props} timeZone="Australia/Melbourne" locales="en-AU" bind:view bind:date />
<p data-testid="date">{date}</p>
