---
'@thomasfosterau/components': minor
---

Add `NavigationStack`, `StackPage` and `createNavigationStack()`: drill-down screens with push and pop view transitions, a Back link named for the previous screen, a touch edge-swipe back, and focus moved to the new title on a push and back to the opened row on a pop. Routing stays the app's: report navigations with `stack.onNavigate(navigation)` from SvelteKit's `onNavigate`. `theme.css` gains the slide keyframes.
