---
'@thomasfosterau/components': minor
---

**Breaking:** `Menu`'s dropdown mode moves to a new `DropdownMenu` component, so a page that only navigates (`Sidebar`, `Menu`, `MenuItem`, `MenuSeparator`) no longer pulls bits-ui's `DropdownMenu` into its bundle (about 30 KB gzip on every page, #129).

- `<Menu mode="dropdown" label …>` becomes `<DropdownMenu label …>`, with the same `open`, `side`, `align`, `class` and `trigger` props and the same `MenuItem` / `MenuSeparator` children. Its roles, accessible name and keyboard behaviour are unchanged.
- `Menu` drops the `mode`, `open`, `side`, `align` and `trigger` props: it is the navigation list only.
- `setMenuMode` is removed. `getMenuMode()` still reports `'dropdown'` inside a `DropdownMenu` and `'nav'` elsewhere.
