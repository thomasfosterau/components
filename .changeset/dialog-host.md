---
'@thomasfosterau/components': minor
---

Add `DialogHost` and `getDialogs()`: `await dialogs.confirm(…)`, `.prompt(…)` and `.alert(…)` open the library's dialogs from code, one at a time, and resolve with the answer. An `AbortSignal` closes a request as cancelled. `Dialog`, `ConfirmDialog` and `PromptDialog` gain `finalFocus`, the element to focus on close.
