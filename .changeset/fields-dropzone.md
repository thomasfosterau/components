---
'@thomasfosterau/components': minor
---

New `Dropzone` field (`fields`): choose one or many files by dropping them on a target or through a "Choose files" button. The chosen files are listed with name, size and an optional thumbnail, each with a remove button. `files` binds a `File[]`. Like `FileInput`, it never uploads.

- `accept`, `maxBytes` and `maxFiles` are checked on drops as well as picks. Rejections are explained in one alert and reported to `onSelect(accepted, rejected)` as `FileRejection`s, a type now exported from `fields`.
- A visually hidden native `<input type="file">` is kept in sync with the list, so a plain form POST sends exactly the listed files under `name`.
- The choose button carries the `FieldControl` id, so `FormField`'s label names it. After a removal, focus moves to the neighbouring remove button. A polite live region announces the selection count.
- Image thumbnails use object URLs, which are revoked when a file is removed or the component is destroyed.

`FileInput`'s size check now comes from a shared internal `file-validation.ts`, with no change in behaviour.
