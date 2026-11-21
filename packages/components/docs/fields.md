# Fields and forms

Form controls wired through the `FormField` + `FieldControl` contract, and the parts of a form that are not one control (`AuthCard`, `ErrorSummary`, `FormErrors`, `FormActions`, `SearchForm`, `HiddenField`, `SaveBar`, the leave guard). Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

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
| `TreeSelect` | one or several | a searchable tree behind a popover | a hierarchy (garden → bed), with whole branches chosen at once |
| `Combobox` | one | filtered as you type | a long or fetched list (`onSearch`) |
| `Listbox` | one or several | a fixed-height inline list, one tab stop | 20 to a few hundred options to scan at once, with typeahead and range selection |
| `Cascader` | one path through a hierarchy | one column per level, in a popover | taxonomy, location or category trees; children can load lazily (`loadChildren`) and `searchable` finds a node at any depth |
| `TransferList` | several, in order | two inline lists, available and chosen | building an ordered subset, such as report columns; `orderable` adds Move up/down and Alt+↑/↓, `searchable` a filter per list |

**When a control uses `labelId`.** `<label for>` names only a labelable element (`input`, `select`, `textarea`, `button`, `meter`, `output`, `progress`); every primitive above is one, and ignores `labelId` (it never reaches the DOM as an attribute). A control whose focusable part is a role on a `span` or `div` — a `role="slider"` thumb, a `role="group"` or `radiogroup` root, a segmented date group — points `aria-labelledby={control.labelId}` at the label instead, and `FormField` forwards a click on its label to it (the control itself if focusable, else its first focusable descendant). `Fieldset` hands its `children` a `FieldsetControl` (`{ labelId }`, the `<legend>`'s id) for the same purpose. `RadioGroup` is its own frame with its own `legend`, so it takes neither.

**Mentions in text.** `MentionInput` is a plain textarea (or one line, `singleLine`) where each of its `triggers` (`@` people, `#` tags, `:` emoji) opens suggestions at the caret; `Combobox` replaces the whole value, this completes one token in running text. The field shows labels ("Hi @Thomas Foster"); the bound `value` stores each mention with its id, `@[Thomas Foster](user:42)`, so renaming a user never breaks old text, and `parseMentions(value, chars?)` / `serializeMentions(text, mentions, chars?)` read and write that format on the server or in a renderer. A trigger with `replace` inserts plain text instead (an emoji for a shortcode). Backspace right after a mention removes it whole; editing inside one turns it back into text. For rich text, mentions belong in the editor's own document model instead.

**Framing an image.** `ImageCropper` takes the `File` an `ImageInput` chose (or a URL) and lets the reader frame it: the frame stays put and the image moves under it, which works on touch and from the keyboard alike (arrows pan, + and − zoom, Home resets; zoom and straighten are also sliders). Bind `area` for the crop in source pixels after `rotation` (send it to the server and crop there), or bind `api` and call `api.toBlob({ type, quality, maxSize })` to crop in the browser; reopening with a saved `area` restores the view. `round` draws a circular mask for avatars, but the crop is always a rectangle: round it where it is shown (`rounded-full`). For the usual "choose a photo, then frame it", give `ImageInput` a `crop` option instead (`{ aspect, round, straighten, output, encode }`): choosing a file opens the cropper in a dialog. With `output: 'area'` (the default) Apply binds `area` and, once `name` is set, posts it as `cropX`, `cropY`, `cropWidth`, `cropHeight`, `cropRotation` and `cropStraighten` beside the original file; with `output: 'blob'` Apply replaces `file`, and the file input's own value, with the cropped image under the original name. Cancel keeps the uncropped file, focus returns to the file input either way, and an Edit crop button reopens the last crop.

## Contextual help

`ContextualHelp` is an ⓘ (or, with `variant="help"`, a ?) button that opens a popover with a heading, a paragraph and an optional `learnMore` link. Use it for an explanation a reader needs now and then: "What's a hardiness zone?", "How is this score calculated?". It opens on click, Enter or Space, never on hover, so it works on touch and can hold a link. Its trigger is named `Information: <title>`, and it never joins the field's `aria-describedby`, because its content is too long to hear on every focus. A short note everyone needs belongs in `hint` instead.

Beside a field label, pass it as `FormField`'s `help` snippet. It renders after the label text but outside the `<label>`, so clicking the label still focuses the control:

```svelte
<FormField label="Zone">
  {#snippet help()}
    <ContextualHelp title="Hardiness zone">The coldest winter your plants can survive.</ContextualHelp>
  {/snippet}
  {#snippet children(control)}
    <TextInput {...control} />
  {/snippet}
</FormField>
```

## Translating `requiredLabel` once

`FormField`, `Fieldset`, `CheckboxGroup` and `RadioGroup` each take `requiredLabel = '(required)'`, the screen-reader text after a required field's label. Like every other string, it is a prop. The components context carries no copy, by design. An i18n app wraps the frame once and imports the wrapper everywhere, rather than threading the prop through every call site:

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

Which multi-choice control: `CheckboxGroup` when every option fits on screen (about seven or fewer), `MultiSelect` for a longer list, `Select` for a single native choice, `TreeSelect` when the options are a hierarchy.

**`TreeSelect`.** Takes `TreeView`'s `TreeNode`s (a node's `id` is its value) and opens a `TreeView` in a popover, with a filter box (`searchable`) that keeps matches and their ancestors and announces the count. Single choice binds `value`; Space selects, Enter or a click picks and closes, and `leavesOnly` makes parents expand-only (they render disabled). `multiple` binds `values` and makes the tree a checkbox tree (`aria-checked`, `'mixed'` for a partly checked parent): checking a node checks every enabled leaf under it. What a fully checked subtree reports is `strategy`: `'parent'` (the topmost node, default), `'leaf'` (its leaves) or `'all'` (both). The trigger is a select-only `combobox` with `aria-haspopup="tree"` that summarises the choice (`maxShown`); a separate Clear button empties it; `name` posts one hidden input per value. `TreeView` gains the same checkbox mode for its own use: `checked(node)` and `onCheck(node)`.

### Choice cards

`RadioGroup` and `CheckboxGroup` take `variant="cards"` to lay their options out as a grid of selectable tiles, for a short list where each option needs a sentence: plans, bed types, delivery speeds. Give each option a `description`; it becomes the card's accessible description, and the title its name. `columns` (`1` to `4`, default `3`, or `'auto'`) sets the widest step of a responsive grid, and `indicator` puts the radio or checkbox at the `'start'` or `'end'` (default), or hides it (`'hidden'`; a checked card still shows a check badge, so the state is never colour alone).

A radio card is a bits-ui radio button, so the group keeps its one tab stop and arrow keys; a checkbox card is a `<label>` around a native checkbox, so the whole tile toggles it and it posts like any other box. A `card` snippet (`(option, { checked, disabled })`) replaces the title and description, but nothing in it may be focusable: a card is already a control, and in development `RadioGroup` warns when one holds a link or button.

```svelte
<RadioGroup legend="Plan" name="plan" variant="cards" options={plans} bind:value={plan} />
```

Which colour control: `ColorSwatchGroup` (in the barrel) when the reader picks from a fixed palette, such as a tag's colour; `ColorPicker` from `@thomasfosterau/components/color-picker` when they may need a colour outside it. `ColorPicker` puts the palette and an HSV editor (a saturation and brightness square, hue and opacity strips, a hex field and, in Chromium, an eyedropper) in a popover. The editor writes `format` (`'hex'` by default; `'rgb'`, `'hsl'` or `'oklch'`), with an alpha term only when `alpha` is set; a picked swatch writes its own `value` unchanged. A swatch's name is its `label`, never its hex, and the trigger's description reads the current colour's name. Both read hex, `rgb()`, `hsl()` and `oklch()`; a colour outside sRGB is clipped for the editor.

```svelte
<FormField label="Bed colour">
  {#snippet children(control)}<ColorPicker {...control} name="colour" swatches={bedColours} bind:value={colour} />{/snippet}
</FormField>
<ColorSwatchGroup label="Tag colour" name="tagColour" swatches={tagColours} bind:value={tagColour} />
```

The native `<input type="color">` remains an option where none of that is needed: it is sRGB `#rrggbb` only, with no alpha or presets, and its picker differs by browser and OS.

`Combobox` takes `onCreate(query, signal)` for a pick-or-create field (a person, a parent record): a query that matches no option's label exactly ends the list with "Create ‘query’" (`createLabel`), and choosing it selects the item the promise resolves to. While it runs the input is `aria-busy` and a polite status says `creatingLabel`; a rejection shows `createErrorLabel` and keeps the old selection; typing again aborts it.

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

### Structured numbers: `MaskedInput`

Prefer a plain `TextInput` with a hint ("For example, 0412 345 678") and validation over a mask: people type and paste numbers in every format, and a mask that fights them is worse than none. Where formatting as you type does help, such as card numbers and phone numbers read back to the person, `MaskedInput` does it without the usual traps:

- A pattern's `9` takes a digit, `a` a letter and `*` either; anything else is a literal, shown only once a character follows it. There are no placeholder underscores for a screen reader to read out.
- The caret stays after the same characters through an edit mid-string, and Backspace or Delete beside a separator removes the digit beyond it.
- Paste is stripped to the raw characters, so `0412-345-678` and `+61 412 345 678` both work. A letter typed into a digits mask is dropped and announced once (`rejectedLabel`).
- `value` is the raw text and is what `name` posts (`submitFormatted` posts `formatted` instead). `formatOn="blur"` leaves the field free while it has focus and formats on blur, which is the right mode for anything people commonly paste.
- `maskPresets` holds `auMobile`, `auPostcode`, `card` (Amex 4-6-5, others 4-4-4-4) and `isoDate`, each with its `inputmode` and `autocomplete`. `cardBrand` and `luhnValid` check a card number. For international phone numbers, format with libphonenumber in the app rather than a fixed pattern.

```svelte
<FormField label="Mobile" hint="For example, 0412 345 678">
  {#snippet children(control)}
    <MaskedInput {...control} mask={maskPresets.auMobile} name="mobile" bind:value={mobile} />
  {/snippet}
</FormField>
```

### Angles and bearings: `AngleSlider`

`AngleSlider` is a round dial for a direction: a bed's aspect, wind or slope direction, a rotation. The thumb is an APG `slider` that wraps from 359° to 0° on a full circle; clockwise is always "increase", whichever way 0° points (`zero="north"`, the default, or `"east"`) and whatever the text direction. Drag anywhere on the dial, or press a mark to jump to it; `restrictToMarks` allows only the marks. `compass` adds N/E/S/W marks and names the compass point in `aria-valuetext` ("135 degrees, south-east"; `compassLabels` translates the names). A slider can't be typed into, so pair it with a `NumberField` for exact values:

```svelte
<FormField label="Aspect">
  {#snippet children(control)}
    <div class="flex items-center gap-4">
      <AngleSlider {...control} compass bind:value={aspect} name="aspect" />
      <NumberField aria-label="Aspect in degrees" min={0} max={360} bind:value={aspect} />
    </div>
  {/snippet}
</FormField>
```

### Signatures: `SignaturePad`

`SignaturePad` takes a signature drawn with a finger, pen or mouse, or a typed name instead. Its value is `{ kind: 'drawn' | 'typed', svg, typedName? }`, or `undefined` while empty; `name` posts the SVG, and `signatureToPng(value, { width, height })` renders a PNG `Blob` for storage or a PDF.

- Drawing is pointer-only, so the **Type** tab is the keyboard and screen-reader path. `allowTyped={false}` removes it and makes the field fail WCAG 2.1.1 (keyboard); development builds warn. Whether a typed name counts as a signature is a legal question for the app.
- The pad is `role="img"` named by `padLabel` and described by its status ("Sign above" / "Signature drawn") and a pointer to the Type tab. It is not focusable, because there is nothing to do there from a keyboard.
- Undo removes the last stroke; Clear empties the pad. One stroke draws at a time, so a hand resting on a tablet while a pen draws is ignored.
- `required` blocks the form while empty and shows `requiredMessage` ("Sign or type your name").
- The exported SVG and PNG use a fixed dark ink (`exportInk`), not a theme token: they are data that must print the same whatever theme the person signed in.

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

### Auth pages: `AuthCard`

`AuthCard` is the whole sign-in, sign-up or password-reset card: a POST form with a heading, the form-level errors, an email field, your own fields (`fields`), a link to the sibling page and a submit button. `redirectTo` is posted as a hidden field. With no enhancement it is a plain POST; with one (its `enhance`, else the components context's) the button shows `pendingLabel` while the request is in flight, and `onResult` hears how it settled.

```svelte
<AuthCard
  title="Sign in"
  redirectTo={data.redirectTo}
  errors={form?.errors}
  email={form?.email}
  emailErrors={form?.fieldErrors?.email}
  altHref="/sign-up"
  altLabel="Create an account"
  submitLabel="Sign in"
  pendingLabel="Signing in…"
>
  {#snippet fields()}
    <FormField label="Password" required>
      {#snippet children(control)}<PasswordInput {...control} name="password" />{/snippet}
    </FormField>
  {/snippet}
</AuthCard>
```

The pending state needs an enhancement that reports the request's lifecycle: see `enhance` in [Getting started](getting-started.md#app-integration).

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
