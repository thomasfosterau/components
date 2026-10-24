# @thomasfosterau/components

## 0.2.0

### Minor Changes

- b160b83: `VectorCanvas` handles keys. When `interactive`, its `<svg>` is one Tab stop with a focus-visible outline. Every keydown and keyup goes to the new `onkey` prop first; a key the caller doesn't claim (with `preventDefault`) falls through to the canvas's own: arrows pan with the `pan` tool (Shift pans further), and `+` / `=` / `-` zoom about the centre. Also new: `activedescendant`, `describedby`, an `overlay` snippet drawn above the elements, and `onfocuschange`. The native `onkeydown` / `onkeyup` / `onfocus` / `onblur` attributes are no longer accepted through the spread (the surface couldn't take focus before, so they never fired); use `onkey` and `onfocuschange`.
- f76d83f: `Combobox` can act as a search box, and the hotkeys family gets its own entry point.

  - `postedValue: 'id' | 'query'` (default `'id'`). With `'query'`, `name` goes on the visible input, so a plain GET form posts the typed text with or without JavaScript, and Enter submits the form unless the reader arrowed to a suggestion.
  - New props: `inputClass` (extra classes on the input, merged last), `initialQuery` (seeds the input text), `onQueryChange` (every keystroke), `onSelect` (the committed item), `hideLabel` (an `sr-only` label) and `portal` (default `true`; `false` keeps the listbox inside the component).
  - The root `<div>` now spreads the remaining native attributes, such as `data-testid`.
  - New `@thomasfosterau/components/hotkeys` export, so `HotkeyHelpDialog` can be imported lazily. The root barrel still re-exports the family.

- 9ced607: New `ContextMenu`, on its own entry `@thomasfosterau/components/context-menu`: a menu at the pointer on right-click, long-press, or Shift+F10 / the Menu key on the focused region, on bits-ui's `ContextMenu`. It takes the same `MenuItem` / `MenuSeparator` children as `DropdownMenu`.

  New menu children for both `DropdownMenu` and `ContextMenu`, exported from the barrel: `MenuCheckboxItem` (`role="menuitemcheckbox"`), `MenuRadioGroup` / `MenuRadioItem` (`role="menuitemradio"`) and `MenuSub` (a submenu). Like `MenuItem`, they import nothing from bits-ui: the enclosing menu lends them its parts through context, so a navigation-only page still loads no menu runtime.

  `MenuMode` gains `'context'`: `getMenuMode()` reports it inside a `ContextMenu`.

- bbbd37f: `DescriptionList` gains a `bare` variant: the `<dl>` takes only the caller's `class` and every `DescriptionRow`'s `<dt>`/`<dd>` is a direct child of it, so a consumer-owned grid (`grid-cols-[auto_1fr]`, say) can hold `DescriptionRow`s beside its own `<dt>`/`<dd>` pairs without a wrapper breaking its columns. `DescriptionListStyle['variant']` widens to include `'bare'`.
- 021f9e7: `EntityForm` (`./entity-form`) takes a `messages` prop: form-level messages from outside its store, such as a SvelteKit action's `fail(500, { message })` that carries no form state (`messages={page.form?.message ? [page.form.message] : undefined}`). They render in the same `FormErrors` block as the store's root errors, after them, one `role="alert"` each.
- 0e6558e: **Breaking:** `FieldControl` has a required `labelId`, the id of the `FormField`'s visible `<label>` (now rendered with that id). A control `<label for>` cannot name — a `role="slider"` thumb, a `group` / `radiogroup` root, a segmented date group — points `aria-labelledby` at it, and `FormField` forwards a click on its label to such a control (the control itself if focusable, else its first focusable descendant). Code that builds a `FieldControl` by hand must now supply `labelId`.

  Every labelable field primitive (`TextInput`, `Textarea`, `DateInput`, `Select`, `Checkbox`, `Toggle`, `FileInput`, `ImageInput`, `VideoInput`, `Combobox`, `PinInput`) accepts and drops `labelId`, so spreading a `FieldControl` never leaks it as an attribute. `Fieldset` gives its `<legend>` an id and hands its `children` snippet a new `FieldsetControl` (`{ labelId }`).

  `Slider` inside a `FormField` is now named by the field's label through `{...control}` alone, with no `label` repeated, and a click on the label focuses its first thumb.

- a2778bc: New `MultiSelect` field (`fields`): several choices from a longer known list in a compact trigger that summarises them ("Full sun, Well-drained, +1"), on bits-ui's `Select` with `type="multiple"`.

  - `values` binds a `string[]`, always kept in option order; `options` takes the same `FieldOption | string` shape as `Select`.
  - `maxShown` (default 2) and `formatOverflow` shape the summary; `placeholder`, `portal`, `size`, an `option` snippet for a richer option body, and the `FieldControl` props on the trigger.
  - The listbox is `aria-multiselectable` and stays open while options are toggled; disabled options carry `aria-disabled`; `name` posts one hidden input per value.

- 12d015e: New `NumberField` field (`fields`): an exact number shown through `Intl.NumberFormat` (units, percent, currency, grouping) in the context's locale and parsed back in the same locale, with − / + stepper buttons — the APG spinbutton.

  - `value` is a `number | undefined`; typed text is parsed on blur or Enter (`"1.234,5"` in `de-DE` is `1234.5`), clamped to `min` / `max`, rounded to the step's or the format's precision, and passed to `onCommit`. Unparseable text reverts; an empty field is `undefined`.
  - `role="spinbutton"` with `aria-valuenow`, `aria-valuemin` / `aria-valuemax` and the formatted `aria-valuetext`; Arrow Up / Down ± `step`, Page Up / Down ± `largeStep`, Home / End to the bounds. The − / + buttons (`decrementLabel`, `incrementLabel`) stay out of the tab order, are disabled at the bounds and auto-repeat while held. No scroll-wheel handling.
  - `name` posts the raw number through a hidden input, never the formatted text.
  - The − / + buttons are sized from the shared `inputButtonSize` table.

- 1d66b79: New `PasswordInput` field (`fields`): a password field with a "Show password" toggle and an explicit `purpose` that sets `autocomplete` to `current-password` or `new-password`, so a password manager fills a sign-in form and offers to generate on a sign-up one.

  - The toggle is a real `type="button"` (it never submits the form) with a constant accessible name, `showLabel`, and an `aria-pressed` state; it `aria-controls` the input, keeps focus, and keeps the input's selection across the type flip.
  - `revealed` is bindable; `revealable={false}` drops the toggle; the field hides again when its form submits.
  - `...rest` (`name`, `minlength`, `aria-*`, `data-*`) lands on the inner input, `class` on the wrapper, `inputClass` on the input.
  - New `inputButtonSize` class table in `fields/field-types.ts`, for a button inside an `input` composite.

- 3f71b80: New `PinInput` field (`fields`): a fixed-length code — a sign-in code, a TOTP, an invite code — typed one character per visible cell into ONE real input, on bits-ui's `PinInput`, so paste, SMS autofill (`autocomplete="one-time-code"`), password managers and form posting treat it as one field.

  - `length` (default 6), `charset` (`'numeric'` | `'alphanumeric'`, setting `inputmode` and the input's pattern), `masked` (bullets in the cells), `onComplete(code)`, `pasteTransformer` (default strips whitespace and hyphens, so "123 456" pastes as "123456"), `size`, and the `FieldControl` props on the real input.
  - The cells are `aria-hidden` presentation; `FormField`'s label names the input.
  - New `pinCellSize` class table in `fields/field-types.ts`.

- 63b3124: New `Slider` field (`fields`): a number, or a `[low, high]` range, picked from a bounded, stepped scale on bits-ui's `Slider`, in daisyUI `range` colours and sizes.

  - `type="single"` binds a `number`; `type="multiple"` binds a `number[]` (default `[min, max]`), one thumb per entry, and the thumbs cannot cross.
  - `formatValue` (default `Intl.NumberFormat(locales)`) sets each thumb's `aria-valuetext` and the visible readout (`showValue`, default on); `ticks`, `orientation`, array `step` snap points, `tone`, `size`.
  - Arrow keys step, Page Up / Page Down jump a tenth of the scale, Home / End go to the ends; `onCommit` fires once per finished interaction.
  - Named by `aria-labelledby={labelId}` (each range thumb adds its own `thumbLabels` entry) or, outside a `FormField`, by `label`; `name` posts one hidden input per thumb.
  - New class tables `rangeTone` (`ui/tones.ts`) and `rangeSize` (`fields/field-types.ts`).

- 38f0c1c: `Infobox` and `InfoboxHeader` take a `headingLevel` prop (`2`–`6`, default `3`). The `h3` default still keeps a box beside prose out of the page outline; raise it when the box is a section of the page in its own right. Only the tag changes.
- 8017613: **Breaking:** `Menu`'s dropdown mode moves to a new `DropdownMenu` component, so a page that only navigates (`Sidebar`, `Menu`, `MenuItem`, `MenuSeparator`) no longer pulls bits-ui's `DropdownMenu` into its bundle (about 30 KB gzip on every page, #129).

  - `<Menu mode="dropdown" label …>` becomes `<DropdownMenu label …>`, with the same `open`, `side`, `align`, `class` and `trigger` props and the same `MenuItem` / `MenuSeparator` children. Its roles, accessible name and keyboard behaviour are unchanged.
  - `Menu` drops the `mode`, `open`, `side`, `align` and `trigger` props: it is the navigation list only.
  - `setMenuMode` is removed. `getMenuMode()` still reports `'dropdown'` inside a `DropdownMenu` and `'nav'` elsewhere.

### Patch Changes

- bbabaef: Doc comments: the exported types that lacked one (`BarSegment`, `StatDelta`, `TimelineDate`, `TimelineEntry`, `tokenise`) gain one, `CommandItem` and `TipStack` hover their own comment rather than their module's, and the first sentences of the infobox row, hotkey, SEO, canvas, chart and tip types stand alone. The README now documents every export, with corrected defaults and examples that compile.
- bbabaef: `EntityForm`'s emitted types name their owners: `fieldProps` values are the form library's widget `props()` shape and `enhance` returns the store's own `props` type (both structurally unchanged). The root errors now come from the store's `errorsAt([])` instead of a cast into its error tree; behaviour is unchanged.

## 0.1.0

### Minor Changes

- 8129ae0: The generic components that still lived in the apps. Each ships with a story and a browser test.

  - **Added `@thomasfosterau/components/seo`**, a new entry point with:
    - `Head`: title with site-name suffix, canonical on the production origin through `canonicalHref` (defaults to the context `href`), `hreflang` alternates, feed link, Open Graph and Twitter / X tags, share image, `article:*` and `prev` / `next`.
    - `JsonLd`: one XSS-safe JSON-LD block.
    - `serializeJsonLd`
    - `ogImageUrl` and its param-name / length-cap / size constants: the content-addressed share-card URL builder.
  - **Added `@thomasfosterau/components/entity-form`**, a new entry point: `EntityForm` renders `@thomasfosterau/effect-forms-svelte` `defineEntityForm` definitions through this library's field primitives. `@thomasfosterau/effect-forms-svelte` is a new **optional** peer, needed only by this entry. The entry is built and tested against `effect@4.0.0-rc.118`, so install `effect >=4.0.0-rc.118` alongside it; nothing else in this package imports Effect.
  - **Added to `/citations`:** `BookCitation`, `ChapterCitation`, `ScholarlyArticleCitation`, `ThesisCitation`, `ReportCitation` and `Publisher`, the CSL-type renderers. They take local record types (`BookRecord`, `ChapterRecord`, `ScholarlyArticleRecord`, `ThesisRecord`, `ReportRecord`, `PublisherRecord`, `CitationDate`) that will align with `@thomasfosterau/biblio` once it is published.
  - **Added** `Year` (formatting), `ContextLinks` (links), `PushToggle` (fields) and `imageDimensions` / `ImageDimensionsUnavailable` (media).
  - **Changed:** `CreditList`'s optional props and `Credit` members now accept an explicit `undefined`, and a trailing role label no longer leaves a space before the caller's punctuation. `ImageInput` now measures through `imageDimensions`; its behaviour is unchanged.

- bd7ecbd: Releases are published through npm Trusted Publishing (OIDC), from a protected `release` environment, instead of a long-lived `NPM_TOKEN`. The published tarballs are packed by pnpm, so `catalog:` and `workspace:*` specifiers resolve to real version ranges exactly as before; no change to either package's API.
- 5fbc916: First full release of the shared component library (the maps components ship as `@thomasfosterau/components-mapbox`), rebuilt on Tailwind CSS 4 + daisyUI 5 + bits-ui 2.

  The package has never been published, so this is the shape the first real release takes rather than a migration. A minor bump because the package is pre-1.0 (`0.1.0` → `0.2.0`).

  - **Removed** the Melt UI seed components (`Button`, `Card*`, `Dialog`, `Select`, `Tooltip`), the `SelectItem` type and the `./styles.css` export from the earlier scaffold. `melt` is no longer a dependency; interaction is bits-ui 2 throughout.
  - **Added** twelve core families, re-exported from the root barrel — `ui`, `layout`, `feedback`, `fields`, `forms`, `data`, `infobox`, `formatting`, `links`, `media`, `hotkeys`, `search` — plus four separate entry points so a consumer that never uses them never loads them: `@thomasfosterau/components/citations`, `/canvas`, `/charts` and `/tips`. The maps family is **not** an entry point of this package: it needs a specific third-party engine (`mapbox-gl`), and a component that needs one lives in its own package adjacent to this one, so this one stays free of it — it ships as `@thomasfosterau/components-mapbox`, where `mapbox-gl` is a required peer.
  - **Added** the `./theme.css` export: two daisyUI themes (`light`/`dark`) on neutral defaults, including four validated `--color-chart-*` categorical slots, that a consumer is expected to redeclare.
  - **Added** the app-integration seam, `setComponentsContext`/`getComponentsContext` (`locale`, `href`, `navigate`, `isCurrent`) — the one injected dependency every component that resolves a link, navigates, or formats a locale-aware value reads from, so the package stays usable outside SvelteKit.
  - **Convention throughout:** every user-facing string is a prop with an English default (no message catalogue — an i18n app passes its own messages at the call site); every component spreads the native attributes of the element it renders and merges the caller's `class` last; no Effect outside the optional `/entity-form` entry.
  - Reviewed in Storybook 10 with the a11y addon, tested in headless Chromium under Vitest browser mode — one story and one browser test per component, asserting accessible name, role and (for interactive components) keyboard path.

  See [`packages/components/README.md`](../packages/components/README.md) for the full component reference and app-integration guide.

- 08e02ed: Both packages declare the `svelte` peer as `^5.40.0` (raised from the unreleased `^5.30.1`). `@thomasfosterau/effect-forms-svelte@0.2.0`, the optional peer behind the `@thomasfosterau/components/entity-form` entry, declares `svelte` `^5.40.0`, so 5.40.0 was already the real floor for any consumer of that entry; both packages now declare it, so they stay on one floor. A consumer on svelte older than 5.40 gets a peer warning (or an install error under `strict-peer-dependencies`) and should upgrade svelte. No API change.

### Patch Changes

- adc2b53: Every component now carries a `<!-- @component -->` summary, so editors show it on hover, and its props carry doc comments, including `@defaultValue` wherever a default is set. Exported helpers and class tables that had no doc comment now have one. No API change.
- 5bdb819: Tested against effect 4.0.0 (the `entity-form` entry's browser suite and story now run on it); peer floor unchanged.
- 4443925: Every optional property of the exported record and option types now accepts an explicit `undefined`, so a caller compiled with `exactOptionalPropertyTypes` can forward its own optional fields (`{ year: reference.year }`) instead of spreading them conditionally: `Citation`, `Footnote`, `TipConfig`, `TipState`, `TipStoreOptions`, `CanvasElement`, `Transform` and `HistoryEntry` in `@thomasfosterau/components`, the members of `setComponentsContext`'s argument, and `MapCamera`, `MapShape` and `StaticMapRequest` in `@thomasfosterau/components-mapbox`. An explicit `undefined` reads as absent, as omitting the field does. No runtime change.
- 2493b82: Every optional prop these packages declare now accepts an explicit `undefined`, so a wrapper compiled with `exactOptionalPropertyTypes` can forward its own optional prop (`<NumberFormat {maximumFractionDigits}>`, `<DynamicMap {label}>`) instead of spreading it conditionally. An explicit `undefined` falls back to the prop's default, as omitting it does. No runtime change.
