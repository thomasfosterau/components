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

- ce08e97: Add `ChatBubble` and `MessageThread` (data family). A thread is a region named by `label` around an ordered list; `live` makes it a polite log. Each message is an article named by its author and time ("Ada Lovelace, 3 minutes ago"), with a `<time datetime>`, a decorative avatar, a status footer and a `tone` from the new `chatBubbleTone` table.
- 5da5d9e: New `@thomasfosterau/components/dates` entry with `Calendar` and `RangeCalendar`, inline month grids on bits-ui for one date or a start–end range.

  - Both take a `DateValue` from `@internationalized/date`. The entry re-exports `parseDate` and the `DateValue` type, so a caller converts at the edge: `parseDate('2026-10-23')` in, `value.toString()` out.
  - Props: `minValue` / `maxValue`, `isDateDisabled`, `isDateUnavailable` (struck through as well as `aria-disabled`), `numberOfMonths`, `weekStartsOn`, `fixedWeeks`, `locales` (falls back to the context), a bindable `month` in view, `calendarLabel` / `previousLabel` / `nextLabel`, `disabled`, `readonly`, a `day` decoration snippet, and the `FieldControl` props. Inside a `FormField`, the calendar is labelled by the field's label.
  - `RangeCalendar` adds `minDays`, `maxDays` and `excludeDisabled`.
  - Neither is in the root barrel, so the date maths load only where they are imported.

- d1ec8d4: Add `DateField` and `TimeField` to `@thomasfosterau/components/dates`: segmented date and time entry on bits-ui, named by the `FormField` label through `labelId`, ordered by the locale, with a forced 12/24-hour clock option and native form submission of the ISO value. The entry also re-exports `parseTime`, `Time` and the `TimeValue` type.
- fc2aca9: Add `DatePicker` and `DateRangePicker` to `@thomasfosterau/components/dates`: the segmented date field plus an icon-only "Choose date" button that opens the calendar in a dialog popover. Picking closes it and returns focus to the button. The range picker's two halves are named groups inside one labelled group, with `minDays` / `maxDays` and per-end form names.
- bbbd37f: `DescriptionList` gains a `bare` variant: the `<dl>` takes only the caller's `class` and every `DescriptionRow`'s `<dt>`/`<dd>` is a direct child of it, so a consumer-owned grid (`grid-cols-[auto_1fr]`, say) can hold `DescriptionRow`s beside its own `<dt>`/`<dd>` pairs without a wrapper breaking its columns. `DescriptionListStyle['variant']` widens to include `'bare'`.
- 1db2d3d: Add `Drawer` (feedback family) and `AppShell` (layout family).

  - `Drawer` is a modal panel at an edge (`start` / `end` / `top` / `bottom`). It shares `Dialog`'s internal body, so focus, dismissal and labelling are one implementation. The new `drawerSide`, `drawerWidth` and `drawerHeight` tables are in `feedback/sizes.ts`.
  - `AppShell` shows the sidebar as a standing column from `lg` up and in a navigation drawer below it, keeping a single `navigation` landmark.

- 021f9e7: `EntityForm` (`./entity-form`) takes a `messages` prop: form-level messages from outside its store, such as a SvelteKit action's `fail(500, { message })` that carries no form state (`messages={page.form?.message ? [page.form.message] : undefined}`). They render in the same `FormErrors` block as the store's root errors, after them, one `role="alert"` each.
- 1de9ef8: Add `Steps` (feedback family): the stages of a multi-step flow as daisyUI `steps`, with each step's state read as text, an `aria-hidden` marker, `aria-current="step"` on the current step and an optional link per step. Adds the `stepTone` and `stepsOrientation` class tables.
- 0e6558e: **Breaking:** `FieldControl` has a required `labelId`, the id of the `FormField`'s visible `<label>` (now rendered with that id). A control `<label for>` cannot name — a `role="slider"` thumb, a `group` / `radiogroup` root, a segmented date group — points `aria-labelledby` at it, and `FormField` forwards a click on its label to such a control (the control itself if focusable, else its first focusable descendant). Code that builds a `FieldControl` by hand must now supply `labelId`.

  Every labelable field primitive (`TextInput`, `Textarea`, `DateInput`, `Select`, `Checkbox`, `Toggle`, `FileInput`, `ImageInput`, `VideoInput`, `Combobox`, `PinInput`) accepts and drops `labelId`, so spreading a `FieldControl` never leaks it as an attribute. `Fieldset` gives its `<legend>` an id and hands its `children` snippet a new `FieldsetControl` (`{ labelId }`).

  `Slider` inside a `FormField` is now named by the field's label through `{...control}` alone, with no `label` repeated, and a click on the label focuses its first thumb.

- fcd0f37: New `Dropzone` field (`fields`): choose one or many files by dropping them on a target or through a "Choose files" button. The chosen files are listed with name, size and an optional thumbnail, each with a remove button. `files` binds a `File[]`. Like `FileInput`, it never uploads.

  - `accept`, `maxBytes` and `maxFiles` are checked on drops as well as picks. Rejections are explained in one alert and reported to `onSelect(accepted, rejected)` as `FileRejection`s, a type now exported from `fields`.
  - A visually hidden native `<input type="file">` is kept in sync with the list, so a plain form POST sends exactly the listed files under `name`.
  - The choose button carries the `FieldControl` id, so `FormField`'s label names it. After a removal, focus moves to the neighbouring remove button. A polite live region announces the selection count.
  - Image thumbnails use object URLs, which are revoked when a file is removed or the component is destroyed.

  `FileInput`'s size check now comes from a shared internal `file-validation.ts`, with no change in behaviour.

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

- 088ea40: New `Rating` field: a star score out of `max` on bits-ui's `RatingGroup` (one Tab stop, `role="slider"`, arrows / Home / End / digit keys, optional half steps, posts under `name`, wired through `FieldControl`), plus a `readonly` display that renders a `role="img"` named "4.5 out of 5" with nothing focusable. New `ratingSize` table.
- 63b3124: New `Slider` field (`fields`): a number, or a `[low, high]` range, picked from a bounded, stepped scale on bits-ui's `Slider`, in daisyUI `range` colours and sizes.

  - `type="single"` binds a `number`; `type="multiple"` binds a `number[]` (default `[min, max]`), one thumb per entry, and the thumbs cannot cross.
  - `formatValue` (default `Intl.NumberFormat(locales)`) sets each thumb's `aria-valuetext` and the visible readout (`showValue`, default on); `ticks`, `orientation`, array `step` snap points, `tone`, `size`.
  - Arrow keys step, Page Up / Page Down jump a tenth of the scale, Home / End go to the ends; `onCommit` fires once per finished interaction.
  - Named by `aria-labelledby={labelId}` (each range thumb adds its own `thumbLabels` entry) or, outside a `FormField`, by `label`; `name` posts one hidden input per thumb.
  - New class tables `rangeTone` (`ui/tones.ts`) and `rangeSize` (`fields/field-types.ts`).

- 5ad51fa: New `TagsInput` field (`fields`): an open-ended list of short strings the reader types (tags, aliases, keywords), each a removable chip, with optional suggestions.

  - Enter or a delimiter (default `,`) commits the text; a paste of "a, b, c" makes three tags; Backspace in an empty input focuses the last tag and a second Backspace removes it; Arrow Left / Right move between the tags and the input; focus is never lost after a removal.
  - `values` binds a `string[]`; `normalise`, `allowDuplicates` (case-insensitive refusal by default), `max` (the input disables at the cap), `name` (one hidden input per tag), `required` (at least one committed tag; `requiredMessage` is the validation message).
  - Suggestions from a static `suggestions` list or a debounced, latest-wins `onSearch` turn the input into bits-ui's combobox.
  - `removeLabel`, `addedMessage` and `removedMessage` take the tag, so an i18n app passes its own formatters; adds and removes are announced in a polite live region.

  `Combobox`'s debounced, latest-wins search moved into a shared internal helper, with no change in behaviour.

- 0741231: Add `Duration` and `Countdown` (formatting family), with `formatDuration`, `durationFromMilliseconds`, `toIsoDuration` and the `DurationValue` type.

  - `Duration` renders a localised length of time in a `<time>` whose `datetime` is the ISO 8601 duration. It uses `Intl.DurationFormat`, with a localised fallback.
  - `Countdown` is a `role="timer"` that ticks in daisyUI's digits. It reads out coarsely (whole minutes, then hours) and announces zero once.

- 38f0c1c: `Infobox` and `InfoboxHeader` take a `headingLevel` prop (`2`–`6`, default `3`). The `h3` default still keeps a box beside prose out of the page outline; raise it when the box is a section of the page in its own right. Only the tag changes.
- 42acc6a: Add `Hero` (layout family): a landing-page banner that renders a `<section>` named by its level-1 headline, with optional description, a `role="group"` call-to-action row, a figure beside the copy, and a decorative background image under a readability overlay.
- 6e647d0: Add the layout primitives `VStack`, `HStack`, `Cluster`, `Grid`, `Spacer` and `Fits` (layout family), and the spacing scale they share (`layout/space.ts`: `Gap`, `MinItem`, `FitsBreakpoint` and their literal class tables). `Grid` sizes columns by minimum item width. `Fits` shows the first of several layouts that fits its container, through CSS container queries. A `ul` / `ol` stack restores `role="list"`.
- 8017613: **Breaking:** `Menu`'s dropdown mode moves to a new `DropdownMenu` component, so a page that only navigates (`Sidebar`, `Menu`, `MenuItem`, `MenuSeparator`) no longer pulls bits-ui's `DropdownMenu` into its bundle (about 30 KB gzip on every page, #129).

  - `<Menu mode="dropdown" label …>` becomes `<DropdownMenu label …>`, with the same `open`, `side`, `align`, `class` and `trigger` props and the same `MenuItem` / `MenuSeparator` children. Its roles, accessible name and keyboard behaviour are unchanged.
  - `Menu` drops the `mode`, `open`, `side`, `align` and `trigger` props: it is the navigation list only.
  - `setMenuMode` is removed. `getMenuMode()` still reports `'dropdown'` inside a `DropdownMenu` and `'nav'` elsewhere.

- 123af69: `Table` row headers and `Pagination` page-number formatting.

  - `TableColumn` takes `rowHeader?: boolean`: that column's body cells render as `<th scope="row">`, so a screen reader moving down another column announces the row's name with each cell. `DataGrid` passes it through, because it shares the column spec.
  - `Pagination` (and `PaginationFooter`) take `formatPage?: (page) => string` for the visible page digits, e.g. `(page) => new Intl.NumberFormat('en-AU').format(page)` for "1,000". Page numbers stay bare by default; `pageLabel` is still the accessible name.

- 7343c77: Add `Accordion` and `AccordionItem` (ui family): a stack of headed, collapsible sections on bits-ui `Accordion`, with `type="single"` (optionally `required`) or `type="multiple"`, a bindable `value`, native `<h{headingLevel}>` headers, `aria-controls`-wired `region` panels, and closed panels kept reachable by find-in-page. `Disclosure` now types and documents `name` (it extends `HTMLDetailsAttributes`), for exclusive native groups.
- 1f00aaa: New `Divider` (`ui`): a horizontal or vertical rule in daisyUI's `divider` styles, optionally with a short label ("or") placed by `align`, and a `tone`.

  - Unlabelled, it is a `role="separator"`; vertical rules add `aria-orientation="vertical"`.
  - Labelled, it is `role="none"`, so the label reads in the page's flow. A separator would make its children presentational and hide the label.
  - `decorative` is `aria-hidden`.

  New `DividerAlign` type and `dividerTone` / `dividerAlign` / `dividerOrientation` tables in `ui/tones.ts`. The orientation table hides daisyUI's inverted naming: `divider-horizontal` draws a vertical rule.

- fcacde9: New `Spinner` (`ui`): an indeterminate loading indicator in any of daisyUI's `loading` shapes (`variant`), with `size` and `tone`. By default it is a `role="status"` named by `label` (default `'Loading'`); `showLabel` prints the label as well, and `decorative` renders the shape alone, `aria-hidden`. New `SpinnerVariant` type and `loadingVariant` / `loadingSize` tables in `ui/tones.ts`. `Button` (`loading`) and `SearchInput` (`pending`) now draw their spinner with `<Spinner decorative>`, with no change in behaviour.
- 7df9874: Add `Stack` (ui family): overlapping cards or images on daisyUI `stack`, top item first. Every item behind the top one is `inert` and `aria-hidden`, and the depth is read as text ("3 items", or `count`). Adds the `stackDirection` class table.
- e37a373: Add `ToggleButton` and `ToggleGroup` (ui family) on bits-ui `Toggle` / `ToggleGroup`. `ToggleButton` is an `aria-pressed` button with an optional `pressedIcon` and a type-enforced `label` when icon-only. `ToggleGroup` is a segmented control (`type="single"`: a radiogroup where arrows move and select, with `required` to keep one selected) or a set of independent toggles (`type="multiple"`), with `labelId` for `FormField`, `name` for form submission, `block`, `showCheck` and an opt-in `tooltip` for icon-only items.
- e930050: Add `Toolbar`, `ToolbarButton`, `ToolbarLink`, `ToolbarToggleGroup`, `ToolbarSeparator` and `ButtonGroup` (ui family).

  - `Toolbar` is a named `role="toolbar"` on bits-ui: one Tab stop, with arrow keys across all its controls.
  - `ToolbarToggleGroup` puts a toggle set inside the toolbar's single Tab stop.
  - `ButtonGroup` is a named daisyUI `join` whose buttons, each with `class="join-item"`, stay independent Tab stops.

### Patch Changes

- bbabaef: Doc comments: the exported types that lacked one (`BarSegment`, `StatDelta`, `TimelineDate`, `TimelineEntry`, `tokenise`) gain one, `CommandItem` and `TipStack` hover their own comment rather than their module's, and the first sentences of the infobox row, hotkey, SEO, canvas, chart and tip types stand alone. The README now documents every export, with corrected defaults and examples that compile.
- bbabaef: `EntityForm`'s emitted types name their owners: `fieldProps` values are the form library's widget `props()` shape and `enhance` returns the store's own `props` type (both structurally unchanged). The root errors now come from the store's `errorsAt([])` instead of a cast into its error tree; behaviour is unchanged.
- d729e10: Drop the redundant `| undefined` the type-aware lint flagged on optional parameters and on `StaticMapRequest.overlay` (`unknown` already includes it), and quote the package names that opened the `@thomasfosterau/charts` entry modules' doc comments, which a JSDoc reader took for tags. The declared types are unchanged.

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
