---
'@thomasfosterau/components': minor
---

Add `AudioPlayer` to `media`: themed controls over a native `<audio>` (play/pause, seek with elapsed and remaining time, skip, speed, mute and volume), an optional transcript disclosure, focus-scoped shortcuts and Media Session metadata. Also exports its time helpers (`formatClock`, `spokenTime`, `clampTime`). `formatDuration` now formats a zero duration as "0 seconds" instead of throwing when `Intl.DurationFormat` is present.
