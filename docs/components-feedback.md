# Feedback: dialogs, toasts and progress

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

Dialogs, toasts, progress — chrome around something that just happened, or is happening now. What these share is the live region and the announcement order, not the markup.

`feedback` also exports `sizes.ts` (`DialogSize`, `ToastPosition`, `BarSize`, `StatsOrientation` and their class tables `dialogSize`, `toastPosition`, `barSize`, `statsOrientation`) and `toaster.ts` (`getToaster`, `setToaster`, `Toast`, `NewToast`, `ToastTone`, `ToasterApi`), plus the prop types below. `colourToken` on a `SegmentBar` segment or a `TimelineEntry` is a CSS custom-property name your theme declares — see `ui`'s `colourTokenStyle`.

| Type | What it is |
| --- | --- |
| `ConfirmForm` | `ConfirmDialog`'s `form` prop — a progressive-enhancement POST: `{ action, method?: 'POST', fields?: Record<string, string>, enhance?: (form) => void \| (() => void) }`. `fields` become hidden inputs inside the form; `enhance` is your app's own `use:enhance`. |
| `BarSegment` | One `SegmentBar` part: `{ label, fraction, colourToken?, tone? }`, `fraction` in `[0, 1]`; `tone` applies only when there is no `colourToken`. |
| `StatDelta` | `StatTile`'s change line: `{ value, unit?: 'count' \| 'percent' \| 'points', label? }`. Positive is up; with `unit: 'percent'`, `3.2` renders as `+3.2%`. |
| `TimelineEntry` | One `Timeline` entry: `{ id, label, subtitle?, start: TimelineDate, end?: TimelineDate, href?, colourToken? }`. Omit `end` for an open-ended, still-current entry; `href` resolves through the components context. |
| `TimelineDate` | One end of a span: `{ label, dateTime? }` — the display text and the machine-readable `<time datetime>` value. |

```svelte
<script lang="ts">
  import { Dialog, ConfirmDialog, Toaster, getToaster, LoadingBoundary, ProgressBar, Stats, StatTile, Button, Skeleton } from '@thomasfosterau/components';
</script>

<Dialog title="Move this plant?" description="It keeps its history — only the bed changes.">
  {#snippet trigger({ props })}<Button {...props} variant="outline">Move plant</Button>{/snippet}
  <p>'Black Krim' moves from North bed to the Glasshouse.</p>
  {#snippet actions({ close })}<Button tone="primary" onclick={close}>Move it</Button>{/snippet}
</Dialog>

<ConfirmDialog title="Delete this garden?" onConfirm={() => deleteGarden(id)} redirectTo="/gardens">
  {#snippet trigger({ props })}<Button {...props} tone="error">Delete garden</Button>{/snippet}
</ConfirmDialog>

<!-- Root layout: one region for the whole app. -->
<Toaster position="bottom-end">{@render children()}</Toaster>
```

```svelte
<script lang="ts">
  // Anywhere below a Toaster.
  const toaster = getToaster();
  toaster.add({ title: 'Bed saved', tone: 'success' });
  toaster.add({ title: 'Could not save the bed', tone: 'error' }, 0); // 0 = sticky

  // 'loading' only for a FIRST read; 'refreshing' while a re-fetch runs over content already on screen.
  const state = $derived(query.error ? 'error' : query.data === undefined ? 'loading' : query.pending ? 'refreshing' : 'ready');
</script>

<LoadingBoundary {state} loadingLabel="Loading beds…" errorLabel="The beds didn't load.">
  {#snippet loading()}<Skeleton variant="text" lines={3} label="Loading beds" />{/snippet}
  <BedList beds={query.data} />
</LoadingBoundary>

<ProgressBar label="Seeds germinated" value={62} showValue />
<Stats aria-label="Garden summary">
  <StatTile label="Plants recorded" value={1284} delta={{ value: 46, label: 'this month' }} />
</Stats>
```
