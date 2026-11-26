---
'@thomasfosterau/components': patch
---

Security: components that render caller-supplied URLs or colours no longer pass unsafe values through.

- `EventCalendar` events, `Timeline` entries, `CreditList` credits, the `url` of `BookCitation`, `ReportCitation`, `ScholarlyArticleCitation`, `ThesisCitation` and `ReferenceList` entries, and `Infobox` / `InfoboxRow` links are linked only when the URL is relative or uses `http:`, `https:`, `mailto:` or `tel:`. Any other scheme, such as `javascript:` (including obfuscated forms like `\tJaVaScRiPt:`), renders without the link; an `EventCalendar` event falls back to its button and `onEventSelect`.
- `ColorSwatchGroup` fills a swatch only when its `value` is a CSS colour, so a value such as `red; background-image: url(…)` can no longer add declarations to the inline style.
- `Image`'s `lqip` placeholder percent-encodes quotes, backslashes and line breaks in `src`, so it can't end its CSS string.
