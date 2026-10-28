---
'@thomasfosterau/components': minor
---

New `TagsInput` field (`fields`): an open-ended list of short strings the reader types (tags, aliases, keywords), each a removable chip, with optional suggestions.

- Enter or a delimiter (default `,`) commits the text; a paste of "a, b, c" makes three tags; Backspace in an empty input focuses the last tag and a second Backspace removes it; Arrow Left / Right move between the tags and the input; focus is never lost after a removal.
- `values` binds a `string[]`; `normalise`, `allowDuplicates` (case-insensitive refusal by default), `max` (the input disables at the cap), `name` (one hidden input per tag), `required` (at least one committed tag; `requiredMessage` is the validation message).
- Suggestions from a static `suggestions` list or a debounced, latest-wins `onSearch` turn the input into bits-ui's combobox.
- `removeLabel`, `addedMessage` and `removedMessage` take the tag, so an i18n app passes its own formatters; adds and removes are announced in a polite live region.

`Combobox`'s debounced, latest-wins search moved into a shared internal helper, with no change in behaviour.
