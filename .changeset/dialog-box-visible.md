---
'@thomasfosterau/components': patch
---

`Dialog` and `LeaveGuardDialog` show their box again. daisyUI 5 keeps a `modal-box` at `opacity: 0` unless it sits inside an open `.modal`, which bits-ui's portalled content never does, so the box was invisible behind its scrim. The box now opens itself on `data-state="open"`, fading and scaling in from `@starting-style` and back out on close.
