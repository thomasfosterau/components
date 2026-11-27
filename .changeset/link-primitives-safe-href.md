---
'@thomasfosterau/components': patch
---

Security: `Link`, `LinkButton`, `ExternalLink` and `MenuItem` drop an `href` whose scheme isn't `http:`, `https:`, `mailto:` or `tel:` (relative URLs still pass), so a `javascript:`, `data:` or `vbscript:` URL can't reach the anchor. `Link` and `ExternalLink` then render their text without a link, `LinkButton` renders as disabled, and `MenuItem` becomes a button that calls `onSelect`.
