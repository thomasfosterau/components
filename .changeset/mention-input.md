---
'@thomasfosterau/components': minor
---

Add `MentionInput`: a textarea (or single-line input) where trigger characters open caret-anchored suggestions, inserting mentions stored with stable ids as `@[label](id)`, with whole-token Backspace, IME-safe triggers and announced results; plus `parseMentions` and `serializeMentions` for the stored format.
