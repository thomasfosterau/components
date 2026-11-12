---
'@thomasfosterau/components': minor
---

Add `SaveBar`, a sticky "Unsaved changes" bar with Discard and Save that appears once a form is dirty (a polite status announces it once, and "Saved" when it goes), and `createLeaveGuard` with `LeaveGuardDialog`, which asks before the reader leaves a dirty page: `beforeunload` is registered only while dirty (so clean pages keep the back/forward cache) and an in-app link goes through `confirmLeave()` in the app's `beforeNavigate`. `EntityForm` gains `saveBar`, `saveBarProps` and a `dirty` output.
