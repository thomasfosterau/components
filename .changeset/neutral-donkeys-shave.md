---
'@thomasfosterau/components': minor
---

Rebuild the library on Tailwind CSS 4 + daisyUI 5 + bits-ui.

Breaking, and deliberately so — the package has never been published, so this is the shape the first release takes rather than a migration:

- **Removed** the Melt UI seed components (`Button`, `Card*`, `Dialog`, `Select`, `Tooltip`), the `SelectItem` type and the `./styles.css` export. `melt` is gone as a dependency.
- **Added** `VisuallyHidden`, and the `./theme.css` export: two daisyUI themes (`light` / `dark`) on neutral defaults that a consumer is expected to redeclare.
- **Styling is now Tailwind 4 + daisyUI 5** and **interaction is bits-ui 2**. Consumers must install `tailwindcss` and `daisyui` themselves and point `@source` at this package's `dist/` — see the README.
- The package is no longer a SvelteKit app with a demo route tree; it is a `svelte-package` library, reviewed through Storybook and tested in a real browser.
