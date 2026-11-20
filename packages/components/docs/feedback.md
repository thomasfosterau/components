# Feedback: dialogs, toasts and progress

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

Dialogs, toasts, progress — chrome around something that just happened, or is happening now. What these share is the live region and the announcement order, not the markup.

`feedback` also exports `sizes.ts` (`DialogSize`, `ToastPosition`, `BarSize`, `StatsOrientation` and their class tables `dialogSize`, `toastPosition`, `barSize`, `statsOrientation`), `consent.svelte.ts` (`createConsent`, `setConsent`, `getConsent`, `cookieStorage`, `parseConsentChoice`, `ConsentApi`, `ConsentCategory`, `ConsentChoice`, `ConsentOptions`, `ConsentStorage`, `CategoryConsent`), `dialogs.ts` (`getDialogs`, `setDialogs`, `DialogsApi`, `ConfirmRequest`, `PromptRequest`, `AlertRequest`) and `toaster.ts` (`getToaster`, `setToaster`, `Toast`, `NewToast`, `ToastTone`, `ToastAction`, `ToastOutcome`, `ToasterApi`), plus the prop types below. `colourToken` on a `SegmentBar` segment or a `TimelineEntry` is a CSS custom-property name your theme declares — see `ui`'s `colourTokenStyle`.

| Type | What it is |
| --- | --- |
| `ConfirmForm` | `ConfirmDialog`'s `form` prop — a progressive-enhancement POST: `{ action, method?: 'POST', fields?: Record<string, string>, enhance?: (form) => void \| (() => void) }`. `fields` become hidden inputs inside the form; `enhance` is your app's own `use:enhance`. |
| `BarSegment` | One `SegmentBar` part: `{ label, fraction, colourToken?, tone? }`, `fraction` in `[0, 1]`; `tone` applies only when there is no `colourToken`. |
| `StatDelta` | `StatTile`'s change line: `{ value, unit?: 'count' \| 'percent' \| 'points', label? }`. Positive is up; with `unit: 'percent'`, `3.2` renders as `+3.2%`. |
| `TimelineEntry` | One `Timeline` entry: `{ id, label, subtitle?, start: TimelineDate, end?: TimelineDate, href?, colourToken? }`. Omit `end` for an open-ended, still-current entry; `href` resolves through the components context. |
| `TimelineDate` | One end of a span: `{ label, dateTime? }` — the display text and the machine-readable `<time datetime>` value. |

```svelte
<script lang="ts">
  import { Dialog, ConfirmDialog, DialogHost, getDialogs, Toaster, getToaster, LoadingBoundary, ProgressBar, Stats, StatTile, Button, Skeleton } from '@thomasfosterau/components';
</script>

<Dialog title="Move this plant?" description="It keeps its history — only the bed changes.">
  {#snippet trigger({ props })}<Button {...props} variant="outline">Move plant</Button>{/snippet}
  <p>'Black Krim' moves from North bed to the Glasshouse.</p>
  {#snippet actions({ close })}<Button tone="primary" onclick={close}>Move it</Button>{/snippet}
</Dialog>

<ConfirmDialog title="Delete this garden?" onConfirm={() => deleteGarden(id)} redirectTo="/gardens">
  {#snippet trigger({ props })}<Button {...props} tone="error">Delete garden</Button>{/snippet}
</ConfirmDialog>

<!-- Root layout: one region and one dialog host for the whole app. -->
<Toaster position="bottom-end"><DialogHost>{@render children()}</DialogHost></Toaster>
```

```svelte
<script lang="ts">
  // Anywhere below a Toaster.
  const toaster = getToaster();
  toaster.add({ title: 'Bed saved', tone: 'success' });
  toaster.add({ title: 'Could not save the bed', tone: 'error' }, 0); // 0 = sticky

  // One action per toast; it lives the Toaster's actionDurationMs (10 s) and pauses on hover or focus.
  async function deleteBed(bed: Bed) {
    hideBed(bed);
    const id = toaster.add({ title: 'Bed deleted', action: { label: 'Undo', onAction: () => showBed(bed) } });
    if ((await toaster.result(id)) !== 'action') await purgeBed(bed); // 'dismissed' or 'timeout'
  }

  // Anywhere below a DialogHost (one in the root layout, next to the Toaster).
  const dialogs = getDialogs();
  async function onDeleteKey(bed: Bed) {
    if (await dialogs.confirm({ title: `Delete ${bed.name}?`, confirmLabel: 'Delete', tone: 'error' })) await deleteBed(bed);
  }
  async function rename(bed: Bed) {
    const name = await dialogs.prompt({ title: 'Rename bed', label: 'Name', value: bed.name }); // undefined when cancelled
    if (name !== undefined) await renameBed(bed, name);
  }

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

## Consent

`ConsentBanner` asks once whether the app may set optional cookies or load third-party content; `ConsentSettings` is the form on your cookie settings page where a reader changes or withdraws that choice. Both read a store you create once in the root layout and publish with `setConsent`. Storage is yours: pass `read` and `write`, or spread `cookieStorage(name)`.

```svelte
<script lang="ts">
  import { ConsentBanner, cookieStorage, createConsent, setConsent } from '@thomasfosterau/components';

  const consent = setConsent(
    createConsent({
      categories: [
        { id: 'necessary', label: 'Strictly necessary cookies', required: true },
        { id: 'analytics', label: 'Analytics cookies' },
      ],
      ...cookieStorage('consent'),
    }),
  );
</script>

<ConsentBanner settingsHref="/cookies" action="/cookies">
  <p>We’d like to set analytics cookies to understand how you use the site.</p>
</ConsentBanner>
```

`cookieStorage` reads `document.cookie` in the browser only. To render the right state on the server (no banner flash for someone who already chose), read the cookie in a server `load`, pass it through `parseConsentChoice`, and give that to `read`. With `action`, the banner is a `<form method="post">` posting `consent=accept|reject`, so it works before scripts load; `ConsentSettings` with `action` posts each enabled category as `consent`.

**Gate loaders on `hasConsent`.** Nothing optional should run until the reader allows it. Start analytics in an effect, and hand an embed its category:

```svelte
<script lang="ts">
  import { Embed, getConsent } from '@thomasfosterau/components';

  const consent = getConsent();
  $effect(() => {
    if (consent.hasConsent('analytics')) startAnalytics();
  });
</script>

<Embed provider="youtube" id={videoId} title="Planting garlic" consent={consent.category('video')} />
```

`hasConsent` is true for a `required` category and false for any other until the reader chooses. `category(id)` is live, so the embed loads as soon as consent is granted anywhere, and activating the embed grants it.

Accept and Reject are deliberately the same button: a prominent Accept beside a buried Reject is the pattern regulators fine. The banner is a region in reading order, not a dialog, so it traps no focus and is not announced on every page.

## Progress or meter

`ProgressBar` is the completion of a task heading to done: an upload, a batch of seeds germinating. A measurement that is not "in progress" (storage used, soil moisture, a battery) is a `Meter`, which screen readers announce as a gauge rather than as something loading. `Meter` is a native `<meter>`: give it `low`, `high` and `optimum` and the platform picks good, fair or poor, drawn in the success, warning and error tokens. Colour alone never carries the threshold, so set `valueText` ("7.2 GB of 10 GB") or `showValue`. `RadialProgress` draws either as a daisyUI ring: `role="progressbar"` by default, `kind="meter"` for a measurement, and indeterminate when a progress ring has no `value`.

```svelte
<Meter label="Storage used" value={7.2} max={10} low={5} high={8} optimum={0} valueText="7.2 GB of 10 GB" showValue />
<RadialProgress label="Soil moisture" kind="meter" value={0.34} max={1} />
```
