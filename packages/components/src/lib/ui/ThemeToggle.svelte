<!-- @component
The light/dark switch: sets `data-theme` on the document element and remembers the choice in `localStorage`.
-->
<!--
  ThemeToggle — the light / dark switch: a checkbox in a round ghost
  button, with the sun / moon drawn by `Swap`, which writes the chosen
  theme name to `document.documentElement.dataset.theme` and remembers it
  in `localStorage`.

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
  checked/unchecked — named by `label`, visually hidden inside its
  `<label>`, which shows the focus ring while the switch has keyboard focus.
  The icons are a `Swap` (itself `aria-hidden`): the visual half of the
  state the switch already announces. Note that
  daisyUI's `theme-controller` class is deliberately NOT used: it applies a
  theme through CSS scoped to the checkbox, which would fight with the
  `data-theme` this component sets on the document element.
-->
<script lang="ts">
  import { Moon, Sun } from '@lucide/svelte';
  import Swap from './Swap.svelte';

  interface Props {
    /** The theme name applied when the switch is off. */
    lightTheme: string;
    /** The theme name applied when the switch is on. */
    darkTheme: string;
    /**
     * `localStorage` key the choice is remembered under.
     * @defaultValue `'theme'`
     */
    storageKey?: string | undefined;
    /**
     * Accessible name of the switch.
     * @defaultValue `'Toggle dark mode'`
     */
    label?: string | undefined;
    /** The active theme name. Bindable; defaults to `lightTheme`. */
    value?: string | undefined;
    /** Extra classes, merged last. */
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

{#snippet sun()}<Sun class="size-5" />{/snippet}
{#snippet moon()}<Moon class="size-5" />{/snippet}

<label
  class={[
    'btn btn-ghost btn-circle has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
    className,
  ]}
>
  <input type="checkbox" role="switch" class="sr-only" checked={dark} aria-label={label} {onchange} />
  <Swap active={dark} effect="rotate" off={sun} on={moon} />
</label>
