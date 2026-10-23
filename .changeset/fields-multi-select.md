---
'@thomasfosterau/components': minor
---

New `MultiSelect` field (`fields`): several choices from a longer known list in a compact trigger that summarises them ("Full sun, Well-drained, +1"), on bits-ui's `Select` with `type="multiple"`.

- `values` binds a `string[]`, always kept in option order; `options` takes the same `FieldOption | string` shape as `Select`.
- `maxShown` (default 2) and `formatOverflow` shape the summary; `placeholder`, `portal`, `size`, an `option` snippet for a richer option body, and the `FieldControl` props on the trigger.
- The listbox is `aria-multiselectable` and stays open while options are toggled; disabled options carry `aria-disabled`; `name` posts one hidden input per value.
