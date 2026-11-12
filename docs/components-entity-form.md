# EntityForm

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

`@thomasfosterau/components/entity-form`. The renderer for [`@thomasfosterau/effect-forms-svelte`](https://github.com/thomasfosterau/effect-forms)'s `defineEntityForm` definitions. It is the only entry point that reaches Effect, so it is kept separate, and its form library and `effect` are optional peers. If you use it, install the form library at `^0.4.0` with its own required peers: `pnpm add @thomasfosterau/effect-forms-svelte @thomasfosterau/effect-ext@^0.2.0 effect`. effect-forms-svelte 0.4 ranges `@thomasfosterau/effect-ext` `^0.1.0 || ^0.2.0` and needs Node 22.18 or later.

Field labels, submit labels and option labels come from the definition's own message thunks. Every other string is a prop.

**The widget bridge.** A `custom` or `rows` widget receives its definition's `props()`, then your `fieldProps[key]`, then `name` / `value` / `onChange` / `errors`, in that order. The bridge goes last, so neither of the first two can sever the store binding. A `custom` widget bridges a string field of the store. A `rows` widget bridges a row list held by the renderer and serialises it itself. Its row list is renderer state, not a store array, so a rows widget adds a row by calling `onChange` with the longer list; it does not reach the store's array mutators. The form library types a widget's `props()` thunk and your `fieldProps[key]` as `WidgetOwnProps<Props>`: the component's own props, partial, without the four bridge keys. A `gate: true` widget disables submit while its value is empty. A create form whose command carries a client id gets a `crypto.randomUUID()` minted once per mount, so a retried submission stays idempotent.

**Error summary.** `errorSummary` renders an `ErrorSummary` at the top of the form in place of the plain form-level `FormErrors` block: the form-level messages, then a link per visible field error, each to the control (`entity-form-<key>`). It takes focus after a failed submission or a posted failure (the store's `isSubmitted` / `isPosted`), never while the reader is still typing. Pass `{ title, titlePrefix }` instead of `true` to change its copy. A custom widget links only if it puts `entity-form-<key>` on its focusable part.

**The store.** `enhance` receives the form's `FormStore`, over the definition's all-string input record (`Readonly<Record<string, string | undefined>>`, one value per entry key), validated by the mode's `createInput` / `updateInput`. Read it through a focus, as the renderer does: `form.get(form.root.key('title'))`, `form.errorsAt(form.root.key('title'))`, and `form.formErrors` for the form-level messages.

**SvelteKit.** This package cannot import `$app/forms`, so pass the form library's `enhanceForm` from `@thomasfosterau/effect-forms-svelte/kit` (the `$app/forms`-backed spreadable attributes):

```svelte
<script lang="ts">
  import { EntityForm } from '@thomasfosterau/components/entity-form';
  import { enhanceForm } from '@thomasfosterau/effect-forms-svelte/kit';
  import { bookForm } from '$lib/entity-forms/book';

  let { data } = $props();
</script>

<EntityForm definition={bookForm} mode="update" initial={data.initial} cancelHref={`/books/${data.id}`} enhance={enhanceForm} />
```

**Unsaved changes.** `saveBar` adds a `SaveBar` inside the form, shown while the store has tainted fields or a `rows` widget has been changed. Save is the form's own submit and Discard is the store's `reset()` (plus the rows' seed). `saveBarProps` passes `position`, labels and `confirmDiscard` through, and `bind:dirty` exposes the state for `createLeaveGuard({ dirty: () => dirty })`; see [Fields](components-fields.md#unsaved-changes-savebar-and-the-leave-guard).
