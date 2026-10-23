---
'@thomasfosterau/components': minor
---

New `ContextMenu`, on its own entry `@thomasfosterau/components/context-menu`: a menu at the pointer on right-click, long-press, or Shift+F10 / the Menu key on the focused region, on bits-ui's `ContextMenu`. It takes the same `MenuItem` / `MenuSeparator` children as `DropdownMenu`.

New menu children for both `DropdownMenu` and `ContextMenu`, exported from the barrel: `MenuCheckboxItem` (`role="menuitemcheckbox"`), `MenuRadioGroup` / `MenuRadioItem` (`role="menuitemradio"`) and `MenuSub` (a submenu). Like `MenuItem`, they import nothing from bits-ui: the enclosing menu lends them its parts through context, so a navigation-only page still loads no menu runtime.

`MenuMode` gains `'context'`: `getMenuMode()` reports it inside a `ContextMenu`.
