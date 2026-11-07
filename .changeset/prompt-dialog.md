---
'@thomasfosterau/components': minor
---

Add `PromptDialog`, a modal that asks for one short value (rename, a new name, type-to-confirm): focus starts in the field with its value selected, Enter submits, Confirm stays disabled while the value is invalid or a (sync or async, debounced) `validate` is pending, a rejection shows under the field, and closing aborts the work in flight. Callback mode (`onConfirm(value, signal)`) or a progressive-enhancement POST (`form`). `Dialog` takes `initialFocus`, to focus an element other than the first focusable one on open.
