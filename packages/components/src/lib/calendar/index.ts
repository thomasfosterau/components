/**
 * `@thomasfosterau/components/calendar` — `EventCalendar`, kept out of the
 * root barrel: most apps never show a schedule, and its date arithmetic and
 * views load only where one does.
 *
 * @module
 */

export { default as EventCalendar } from './EventCalendar.svelte';
export { localeWeekStart, type CalendarEvent, type CalendarView } from './events.ts';
