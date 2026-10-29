---
'@thomasfosterau/components': minor
---

Add `Duration` and `Countdown` (formatting family), with `formatDuration`, `durationFromMilliseconds`, `toIsoDuration` and the `DurationValue` type.

- `Duration` renders a localised length of time in a `<time>` whose `datetime` is the ISO 8601 duration. It uses `Intl.DurationFormat`, with a localised fallback.
- `Countdown` is a `role="timer"` that ticks in daisyUI's digits. It reads out coarsely (whole minutes, then hours) and announces zero once.
