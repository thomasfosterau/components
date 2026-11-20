---
'@thomasfosterau/components': minor
---

Add `TableOfContents`, an "On this page" navigation collected from a container's headings (or given `entries`), nested by level, with an `IntersectionObserver` scroll-spy marking the section in view as `aria-current="location"`. A click scrolls, moves focus to the heading and replaces the hash; below `collapseBelow` it folds into a disclosure. Also exports `nestEntries`, `collectHeadings` and the `TocEntry` types.
