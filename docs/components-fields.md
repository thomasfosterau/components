# Fields and forms

Form controls wired through the `FormField` + `FieldControl` contract, and the parts of a form that are not one control (`ErrorSummary`, `FormErrors`, `FormActions`, `SearchForm`, `HiddenField`, `SaveBar`, the leave guard). Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

Form controls wired through the `FormField` + `FieldControl` contract. `FormField` (one control) or `Fieldset` (a group) owns the label, hint and errors; it derives `hintId`/`errorId` from a single `id` and hands `children` a `FieldControl`:

```ts
interface FieldControl {
  id: string;
  labelId: string; // the visible <label>'s id
  describedBy: string;
  invalid: boolean;
  required: boolean;
}
```

Every primitive accepts it by spread — `<TextInput {...control} bind:value />` — so `for`/`id`, `aria-describedby`, `aria-invalid` and `required` cannot drift apart. `errors` is always `readonly string[]`; a field that fails three rules says three things.

**Which choice control?**

| Control | Choose | Options on screen | Best for |
| --- | --- | --- | --- |
| `RadioGroup` | one | all, one row each | about seven or fewer, where seeing every option matters |
| `CheckboxGroup` | several | all, one row and one tab stop each | about seven or fewer |
| `Select` | one | behind the native popup | a known list of any length; no script, the platform picker |
| `MultiSelect` | several | behind a popover, summarised in the trigger | a longer known list in a compact space |
| `Combobox` | one | filtered as you type | a long or fetched list (`onSearch`) |
| `Listbox` | one or several | a fixed-height inline list, one tab stop | 20 to a few hundred options to scan at once, with typeahead and range selection |

**When a control uses `labelId`.** `<label for>` names only a labelable element (`input`, `select`, `textarea`, `button`, `meter`, `output`, `progress`); every primitive above is one, and ignores `labelId` (it never reaches the DOM as an attribute). A control whose focusable part is a role on a `span` or `div` — a `role="slider"` thumb, a `role="group"` or `radiogroup` root, a segmented date group — points `aria-labelledby={control.labelId}` at the label instead, and `FormField` forwards a click on its label to it (the control itself if focusable, else its first focusable descendant). `Fieldset` hands its `children` a `FieldsetControl` (`{ labelId }`, the `<legend>`'s id) for the same purpose. `RadioGroup` is its own frame with its own `legend`, so it takes neither.

## Translating `requiredLabel` once

(Issue #419.) `FormField`, `Fieldset`, `CheckboxGroup` and `RadioGroup` each take `requiredLabel = '(required)'`, the screen-reader text after a required field's label. Like every other string, it is a prop. The components context carries no copy, by design (#353). An i18n app wraps the frame once and imports the wrapper everywhere, rather than threading the prop through every call site:

```svelte
<!-- src/lib/components/AppFormField.svelte, in the app -->
<script lang="ts">
  import { FormField } from '@thomasfosterau/components';
  import type { ComponentProps } from 'svelte';
  import { m } from '$lib/paraglide/messages';

  let props: ComponentProps<typeof FormField> = $props();
</script>

<FormField requiredLabel={m.required()} {...props} />
```

The wrapper passes `requiredLabel` before the spread, so a call site can still override it. Wrap `Fieldset`, `CheckboxGroup` and `RadioGroup` the same way if the app uses them. The same pattern fits any default an app always translates (`dismissLabel`, `previousLabel`, …): one wrapper per component, not a message bag in the context.

Which date control: `DateInput` (the native control, in the barrel) for a single date on a form; `DateField` / `TimeField` from `@thomasfosterau/components/dates` when the design needs the same control on every browser, or a time with a fixed 12/24-hour clock; `DatePicker` when the reader benefits from seeing the month but the field should stay compact, `Calendar` when the month should always show; `DateRangePicker` / `RangeCalendar` for a span. Their values are `DateValue`s: `parseDate('2026-10-23')` in, `value.toString()` out.

Which multi-choice control: `CheckboxGroup` when every option fits on screen (about seven or fewer), `MultiSelect` for a longer list, `Select` for a single native choice.

`Combobox` posts the selected id under `name` (a hidden input) by default. `postedValue="query"` makes it a search box instead: `name` goes on the visible input, so a plain `<form method="GET">` posts the typed text with JavaScript on or off, and Enter submits that form unless the reader moved to a suggestion with the arrow keys (clicking a suggestion still commits it, and `onSelect` receives it). `hideLabel` keeps `label` as the accessible name but renders it `sr-only`; `portal={false}` renders the listbox inside the component rather than in `<body>`, still floating.

```svelte
<form method="GET" action="/search" class="join">
  <Combobox
    label="Search" hideLabel name="query" postedValue="query" initialQuery={currentQuery}
    onSearch={suggest} getId={(hit) => hit.id} getLabel={(hit) => hit.title}
    inputClass="join-item" onSelect={(hit) => navigate(hit.href)}
  />
  <button type="submit" class="btn join-item">Search</button>
</form>
```

`fields` also exports `field-types.ts` (`FieldControl`, `FieldsetControl`, `FieldSize`, `FieldOption`, `FieldOptionInput`, `toFieldOptions`) and the daisyUI size tables (`inputSize`, `textareaSize`, `selectSize`, `checkboxSize`, `toggleSize`, `fileInputSize`, `rangeSize`, `pinCellSize`, `inputButtonSize`, each a `Record<FieldSize, string>`), and from `PushToggle` the `PushEnableResult` type (`{ _tag: 'enabled' | PushDeclineReason }`) and `PushDeclineReason` (`'unsupported' | 'unavailable' | 'denied'` — why `enable` did not subscribe, each with its own message prop).

```svelte
<script lang="ts">
  import { FormField, TextInput, Select, Textarea, CheckboxGroup, RadioGroup, Toggle, Combobox } from '@thomasfosterau/components';
</script>

<!-- One id becomes the label's `for`, the input's `aria-describedby`/`aria-invalid`, and the error region's id. -->
<FormField label="Scientific name" hint="Genus and species, as published." errors={nameErrors} required>
  {#snippet children(control)}<TextInput {...control} name="scientificName" bind:value={name} />{/snippet}
</FormField>

<FormField label="Rank">
  {#snippet children(control)}<Select {...control} options={['Family', 'Genus', 'Species']} bind:value={rank} />{/snippet}
</FormField>

<CheckboxGroup legend="Growing conditions" name="conditions" options={conditionOptions} bind:values={conditions} />

<!-- onChange may refuse: whatever it resolves to is written back, so a denied permission never leaves the switch reading "on". -->
<Toggle label="Notify this browser" checked={registered} onChange={(next) => (next ? registerPush() : unregisterPush())} />

<!-- Debounced, latest-wins, previous results stay on screen while the next are in flight. -->
<Combobox
  label="Taxon" name="taxonId" onSearch={searchTaxa}
  getId={(taxon) => taxon.id} getLabel={(taxon) => taxon.name} getBadge={(taxon) => taxon.rank}
  bind:value={taxonId}
/>
```

## Forms

Three components carry error messages, split by where the reader meets them. `FieldErrors` (inside `FormField` and `Fieldset`) sits under its control and says what is wrong with it. `FormErrors` holds the messages that belong to the submission and have no field. `ErrorSummary` sits at the top of the form after a failed submission, repeats both in one list, and takes focus so that a screen-reader user, who hears nothing from a reloaded page, learns that it failed and where, and a sighted user on a long form does not have to hunt. The repetition is deliberate; use the summary alongside the field errors, not instead of them.

The split from `fields` is by who owns the message: a `FormErrors` message has no field to attach to, and a `FormActions` row belongs to the form rather than anything in it.

```svelte
<script lang="ts">
  import { FormActions, FormErrors, HiddenField, FormField, TextInput } from '@thomasfosterau/components';
</script>

<form method="post" action="/gardens/42/plants">
  <FormErrors messages={form?.errors?._errors} />
  <HiddenField name="gardenId" value={garden.id} />
  <FormField label="Plant name" errors={form?.errors?.name} required>
    {#snippet children(control)}<TextInput {...control} name="name" bind:value={name} />{/snippet}
  </FormField>
  <FormActions submitLabel="Add plant" pendingLabel="Adding…" pending={saving} cancelHref={`/gardens/${garden.id}`} />
</form>

<!-- After a failed POST: a focused list of links, one per message. Give each FormField the id the summary links to, fieldId(formId, name), or pass ErrorSummaryItems with your own ids. -->
<ErrorSummary formId="plant" errors={{ name: form?.errors?.name ?? [] }} formErrors={form?.errors?._errors} />

<!-- A GET form on purpose: a search result should be a URL people can bookmark, share and go back to. -->
<SearchForm action="/search" name="query" label="Search the site" placeholder="Scientific or common name" />
```

### Unsaved changes: `SaveBar` and the leave guard

`SaveBar` shows "Unsaved changes" with Discard and Save, sticky at the bottom (or `position="top"`), from the first edit until the form is saved or discarded. Save is a real submit button tied to the form by `form="…"`, so it works from outside the `<form>` and without scripting; give it `onSave` instead to run a callback. It never takes focus, announces itself once (and "Saved" when it goes away) in a polite status region, and asks "Discard changes?" before `onDiscard` unless `confirmDiscard={false}`. A sticky bar can cover a focused field, so give the scroller room: `html { scroll-padding-block: 5rem; }` (at least the bar's height). `EntityForm` takes `saveBar` and does all of this from its own store; `bind:dirty` hands its dirty state to a guard.

`createLeaveGuard({ dirty })` covers the two ways out of a page. Closing the tab goes through the browser's `beforeunload`, which the guard registers only while `dirty()` is true, so clean pages stay eligible for the back/forward cache; browsers show their own generic text there and ignore any custom message, so there is none to set. An in-app link is the router's, and this library cannot import `$app/navigation`, so wire `shouldBlock()` and `confirmLeave()` into your layout's `beforeNavigate` and mount one `LeaveGuardDialog` (an `alertdialog`; focus starts on Stay, Escape is Stay). Create the guard while a component initialises.

```svelte
<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { createLeaveGuard, LeaveGuardDialog, SaveBar } from '@thomasfosterau/components';

  let dirty = $state(false);
  const guard = createLeaveGuard({ dirty: () => dirty });

  let leaving = false;
  beforeNavigate((nav) => {
    if (leaving || nav.type === 'leave' || !guard.shouldBlock()) return;
    nav.cancel();
    void guard.confirmLeave().then((leave) => {
      if (leave && nav.to) {
        leaving = true;
        void goto(nav.to.url);
      }
    });
  });
</script>

<form id="edit-bed" method="post"><!-- fields set dirty = true --></form>
<SaveBar {dirty} form="edit-bed" onDiscard={() => (dirty = false)} />
<LeaveGuardDialog {guard} />
```

(`nav.type === 'leave'` is the tab closing, which the guard's own `beforeunload` handles.)
