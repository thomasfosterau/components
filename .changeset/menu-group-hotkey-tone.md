---
'@thomasfosterau/components': minor
---

Add `MenuGroup`, a labelled run of menu items (a `role="group"` in a `DropdownMenu` or `ContextMenu`, a titled sub-list in a navigation `Menu`). `MenuItem` takes `hotkey` (a trailing `HotkeyBadge`, announced through `aria-keyshortcuts` rather than joining the item's name) and `tone="error"` for a destructive item. The hotkeys family exports `ariaKeyShortcuts(trigger)`.
