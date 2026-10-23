---
'@thomasfosterau/components': minor
---

New `Slider` field (`fields`): a number, or a `[low, high]` range, picked from a bounded, stepped scale on bits-ui's `Slider`, in daisyUI `range` colours and sizes.

- `type="single"` binds a `number`; `type="multiple"` binds a `number[]` (default `[min, max]`), one thumb per entry, and the thumbs cannot cross.
- `formatValue` (default `Intl.NumberFormat(locales)`) sets each thumb's `aria-valuetext` and the visible readout (`showValue`, default on); `ticks`, `orientation`, array `step` snap points, `tone`, `size`.
- Arrow keys step, Page Up / Page Down jump a tenth of the scale, Home / End go to the ends; `onCommit` fires once per finished interaction.
- Named by `aria-labelledby={labelId}` (each range thumb adds its own `thumbLabels` entry) or, outside a `FormField`, by `label`; `name` posts one hidden input per thumb.
- New class tables `rangeTone` (`ui/tones.ts`) and `rangeSize` (`fields/field-types.ts`).
