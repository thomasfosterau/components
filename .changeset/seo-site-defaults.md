---
'@thomasfosterau/components': minor
---

`/seo` exports `setSeoContext`: `Head`'s site-wide defaults (site name, title separator, fallback description, pathname, `canonicalHref`, locales, `og:locale`, feeds, robots, default image, share-card path and alt, Twitter card and site), set once in the root layout so pages pass only what is their own. A prop on `Head` always wins. `Head`'s `feed` also takes several `FeedLink`s, and a blank `description` now falls back to the site's when one is set.
