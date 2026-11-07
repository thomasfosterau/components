---
'@thomasfosterau/components': minor
---

Add `IconButton`, an icon-only button or link whose required `label` is its accessible name and its tooltip, with a 24×24 minimum target, and `IconLabel`, an icon beside a title that stays real text in every style (`title-and-icon`, `icon-only`, `title-only`). `Alert`'s dismiss, `Dialog`'s close, `SearchInput`'s clear and `Navbar`'s menu toggle now share the same icon-only naming rule (their accessible names are unchanged; the name is now the control's `aria-label`), through a tooltip-free core, so none of them loads the tooltip.
