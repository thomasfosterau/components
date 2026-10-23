---
'@thomasfosterau/components': minor
---

**Breaking:** `FieldControl` has a required `labelId`, the id of the `FormField`'s visible `<label>` (now rendered with that id). A control `<label for>` cannot name — a `role="slider"` thumb, a `group` / `radiogroup` root, a segmented date group — points `aria-labelledby` at it, and `FormField` forwards a click on its label to such a control (the control itself if focusable, else its first focusable descendant). Code that builds a `FieldControl` by hand must now supply `labelId`.

Every labelable field primitive (`TextInput`, `Textarea`, `DateInput`, `Select`, `Checkbox`, `Toggle`, `FileInput`, `ImageInput`, `VideoInput`, `Combobox`) accepts and drops `labelId`, so spreading a `FieldControl` never leaks it as an attribute. `Fieldset` gives its `<legend>` an id and hands its `children` snippet a new `FieldsetControl` (`{ labelId }`).
