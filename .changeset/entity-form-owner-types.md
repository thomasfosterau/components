---
'@thomasfosterau/components': patch
---

`EntityForm`'s emitted types name their owners: `fieldProps` values are the form library's widget `props()` shape and `enhance` returns the store's own `props` type (both structurally unchanged). The root errors now come from the store's `errorsAt([])` instead of a cast into its error tree; behaviour is unchanged.
