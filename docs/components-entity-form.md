# EntityForm

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

`@thomasfosterau/components/entity-form`. The renderer for [`@thomasfosterau/effect-forms-svelte`](https://github.com/thomasfosterau/effect-forms)'s `defineEntityForm` definitions. It is the only entry point that reaches Effect, so it is kept separate, and its form library and `effect` are optional peers: `pnpm add @thomasfosterau/effect-forms-svelte effect` if you use it.

Field labels, submit labels and option labels come from the definition's own message thunks. Every other string is a prop.

**The widget bridge.** A `custom` or `rows` widget receives its definition's `props()`, then your `fieldProps[key]`, then `name` / `value` / `onChange` / `errors`, in that order. The bridge goes last, so neither of the first two can sever the store binding. A `custom` widget bridges a string field of the store. A `rows` widget bridges a row list held by the renderer and serialises it itself. A `gate: true` widget disables submit while its value is empty. A create form whose command carries a client id gets a `crypto.randomUUID()` minted once per mount, so a retried submission stays idempotent.

**Error summary.** `errorSummary` renders an `ErrorSummary` at the top of the form in place of the plain form-level `FormErrors` block: the form-level messages, then a link per visible field error, each to the control (`entity-form-<key>`). It takes focus after a failed submission or a posted failure, never while the reader is still typing. Pass `{ title, titlePrefix }` instead of `true` to change its copy. A custom widget links only if it puts `entity-form-<key>` on its focusable part.

**SvelteKit.** This package cannot import `$app/forms`, so pass your app's `enhanceForm` (the `$app/forms`-backed spreadable attributes, which effect-forms#2 moves into `@thomasfosterau/effect-forms-svelte/kit`):

```svelte
<script lang="ts">
  import { EntityForm } from '@thomasfosterau/components/entity-form';
  import { enhanceForm } from '$lib/effect-form';
  import { bookForm } from '$lib/entity-forms/book';

  let { data } = $props();
</script>

<EntityForm definition={bookForm} mode="update" initial={data.initial} cancelHref={`/books/${data.id}`} enhance={enhanceForm} />
```

**Unsaved changes.** `saveBar` adds a `SaveBar` inside the form, shown while the store has tainted fields or a `rows` widget has been changed. Save is the form's own submit and Discard is the store's `reset()` (plus the rows' seed). `saveBarProps` passes `position`, labels and `confirmDiscard` through, and `bind:dirty` exposes the state for `createLeaveGuard({ dirty: () => dirty })`; see [Fields](components-fields.md#unsaved-changes-savebar-and-the-leave-guard).
