---
'@thomasfosterau/components': minor
---

Add `HotkeyInput`, a field that records a keyboard shortcut (platform glyphs, a spoken description, refusal of browser-reserved and already-used chords), and `HotkeyEditor`, a settings table for rebinding, disabling and resetting every registered command, with a switch for single-key shortcuts (WCAG 2.1.4). The hotkey registry gains `overrides` and `onOverridesChange`, `setBinding`, `reset`, `conflicts`, `bindings`, `singleKeyEnabled` and `pause()`; `HotkeyProvider` does nothing while it is paused. Also exports the recording helpers (`chordOf`, `chordParts`, `defaultReservedHotkeys`, …).
