---
'@thomasfosterau/components': minor
---

`VectorCanvas` handles keys. When `interactive`, its `<svg>` is one Tab stop with a focus-visible outline. Every keydown and keyup goes to the new `onkey` prop first; a key the caller doesn't claim (with `preventDefault`) falls through to the canvas's own: arrows pan with the `pan` tool (Shift pans further), and `+` / `=` / `-` zoom about the centre. Also new: `activedescendant`, `describedby`, an `overlay` snippet drawn above the elements, and `onfocuschange`. The native `onkeydown` / `onkeyup` / `onfocus` / `onblur` attributes are no longer accepted through the spread (the surface couldn't take focus before, so they never fired); use `onkey` and `onfocuschange`.
