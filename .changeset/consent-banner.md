---
'@thomasfosterau/components': minor
---

Add `ConsentBanner` and `ConsentSettings` with a consent store (`createConsent`, `setConsent`, `getConsent`, `hasConsent`, `category(id)` for `Embed`'s `consent`) and a `cookieStorage` helper. Accept and Reject have equal weight, the banner is a plain region rather than a dialog, the confirmation takes focus, and with `action` the choice posts before scripts load.
