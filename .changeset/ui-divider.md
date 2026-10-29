---
'@thomasfosterau/components': minor
---

New `Divider` (`ui`): a horizontal or vertical rule in daisyUI's `divider` styles, optionally with a short label ("or") placed by `align`, and a `tone`.

- Unlabelled, it is a `role="separator"`; vertical rules add `aria-orientation="vertical"`.
- Labelled, it is `role="none"`, so the label reads in the page's flow. A separator would make its children presentational and hide the label.
- `decorative` is `aria-hidden`.

New `DividerAlign` type and `dividerTone` / `dividerAlign` / `dividerOrientation` tables in `ui/tones.ts`. The orientation table hides daisyUI's inverted naming: `divider-horizontal` draws a vertical rule.
