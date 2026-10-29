---
'@thomasfosterau/components': minor
---

New `Spinner` (`ui`): an indeterminate loading indicator in any of daisyUI's `loading` shapes (`variant`), with `size` and `tone`. By default it is a `role="status"` named by `label` (default `'Loading'`); `showLabel` prints the label as well, and `decorative` renders the shape alone, `aria-hidden`. New `SpinnerVariant` type and `loadingVariant` / `loadingSize` tables in `ui/tones.ts`. `Button` (`loading`) and `SearchInput` (`pending`) now draw their spinner with `<Spinner decorative>`, with no change in behaviour.
