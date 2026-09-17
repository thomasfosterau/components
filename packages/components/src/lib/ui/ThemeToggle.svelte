<!--
  ThemeToggle — the light / dark switch: a daisyUI `swap` label around a
  checkbox, which writes the chosen theme name to
  `document.documentElement.dataset.theme` and remembers it in
  `localStorage`.

  Generic on purpose. The two theme NAMES are props, because this library
  ships tokens rather than a brand and an app may call its themes anything;
  `storageKey` is a prop for the same reason.

  **The pre-paint script is the app's job.** This component can only run
  after hydration, so a returning visitor whose choice was dark would flash
  light first. The fix is three lines the app inlines in its document head,
  before any stylesheet, reading the same key:

  ```html
  <script>
    try {
      const t = localStorage.getItem('theme');
      if (t) document.documentElement.dataset.theme = t;
    } catch {}
  </script>
  ```

  Every `localStorage` access here is wrapped: it throws outright in a private
  window and with site data blocked, and a remembered theme is a convenience
  that must never be able to stop the control rendering.

  ARIA contract: a real checkbox with `role="switch"` — on/off, not
  checked/unchecked — named by `label`. Both icons are `aria-hidden`; they
  are the visual half of the state the switch already announces. Note that
  daisyUI's `theme-controller` class is deliberately NOT used: it applies a
  theme through CSS scoped to the checkbox, which would fight with the
  `data-theme` this component sets on the document element.
-->
<script lang="ts">
  import { Moon, Sun } from '@lucide/svelte';

  interface Props {
    /** The theme name applied when the switch is off. */
    lightTheme: string;
    /** The theme name applied when the switch is on. */
    darkTheme: string;
    /** `localStorage` key the choice is remembered under. */
    storageKey?: string | undefined;
    /** Accessible name of the switch. */
    label?: string | undefined;
    /** The active theme name. Bindable; defaults to `lightTheme`. */
    value?: string | undefined;
    class?: string | undefined;
  }

  let {
    lightTheme,
    darkTheme,
    storageKey = 'theme',
    label = 'Toggle dark mode',
    value = $bindable(),
    class: className,
  }: Props = $props();

  // Read the remembered choice after mount: `localStorage` does not exist on
  // the server, and a value read during render would not survive hydration.
  $effect(() => {
    try {
      const stored = globalThis.localStorage?.getItem(storageKey);
      if (stored === darkTheme || stored === lightTheme) value = stored;
    } catch {
      // Storage unavailable — the in-memory default stands.
    }
  });

  const active = $derived(value ?? lightTheme);
  const dark = $derived(active === darkTheme);

  const onchange = (event: Event & { currentTarget: HTMLInputElement }): void => {
    const next = event.currentTarget.checked ? darkTheme : lightTheme;
    value = next;
    document.documentElement.dataset.theme = next;
    try {
      globalThis.localStorage?.setItem(storageKey, next);
    } catch {
      // Storage unavailable — the theme still applies for this page view.
    }
  };
</script>

<label class={['swap swap-rotate btn btn-ghost btn-circle', className]}>
  <input type="checkbox" role="switch" checked={dark} aria-label={label} {onchange} />
  <Sun class="swap-off size-5" aria-hidden="true" />
  <Moon class="swap-on size-5" aria-hidden="true" />
</label>
