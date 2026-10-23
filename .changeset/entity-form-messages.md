---
'@thomasfosterau/components': minor
---

`EntityForm` (`./entity-form`) takes a `messages` prop: form-level messages from outside its store, such as a SvelteKit action's `fail(500, { message })` that carries no form state (`messages={page.form?.message ? [page.form.message] : undefined}`). They render in the same `FormErrors` block as the store's root errors, after them, one `role="alert"` each.
