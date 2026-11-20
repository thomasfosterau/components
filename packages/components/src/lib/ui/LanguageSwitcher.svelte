<!-- @component
A language switcher naming each locale in its own language: a toggle to the other one when there are two, a menu when there are more.
-->
<!--
  LanguageSwitcher — the header control that changes the UI language. Each
  locale is named by its endonym (`languageEndonyms`, on `Intl.DisplayNames`),
  in its own language whatever the current one, and sits in a `lang` span so
  a screen reader pronounces it in that language (the span, not the control:
  `lang` on the control would also apply to its English accessible name).

  Two shapes, chosen by `variant` (`'auto'` picks by count):
  - **toggle** (exactly two locales): one control naming the OTHER language,
    "Español", whose accessible name is `switchLabel(name)`, "Switch to
    Español" (which contains the visible text, as WCAG 2.5.3 asks).
  - **menu**: a `DropdownMenu` whose trigger names the current language.
    With `href` each item is a link (`hreflang`, `aria-current` on the
    current one) and works without JavaScript; with only `onSelect` the items
    are a `MenuRadioGroup`, so the current one is announced as checked.

  `href` wins when both are given: a link still works before hydration.
-->
<script lang="ts">
  import Button from './Button.svelte';
  import DropdownMenu from './DropdownMenu.svelte';
  import { languageEndonyms } from './language-names.ts';
  import LinkButton from './LinkButton.svelte';
  import MenuItem from './MenuItem.svelte';
  import MenuRadioGroup from './MenuRadioGroup.svelte';
  import MenuRadioItem from './MenuRadioItem.svelte';

  interface Props {
    /** The site's locales, as BCP 47 tags, in display order. */
    locales: readonly string[];
    /** The locale the page is in. */
    current: string;
    /** The URL of this page in another locale. Items become links. */
    href?: ((locale: string) => string) | undefined;
    /** Switch locale in place (e.g. Paraglide's `setLocale`). */
    onSelect?: ((locale: string) => void) | undefined;
    /** Names to use instead of `Intl.DisplayNames`' endonyms, by locale. */
    names?: Readonly<Record<string, string>> | undefined;
    /**
     * `'toggle'` for two locales, `'menu'` otherwise.
     * @defaultValue `'auto'`
     */
    variant?: 'auto' | 'toggle' | 'menu' | undefined;
    /**
     * The menu's accessible name.
     * @defaultValue `'Language'`
     */
    label?: string | undefined;
    /**
     * The toggle's accessible name, given the other language's name.
     * @defaultValue `` (name) => `Switch to ${name}` ``
     */
    switchLabel?: ((name: string) => string) | undefined;
    class?: string | undefined;
  }

  let {
    locales,
    current,
    href,
    onSelect,
    names,
    variant = 'auto',
    label = 'Language',
    switchLabel = (name) => `Switch to ${name}`,
    class: className,
  }: Props = $props();

  const endonyms = $derived(languageEndonyms(locales, names));
  const nameOf = (locale: string): string => endonyms.get(locale) ?? locale;
  const isToggle = $derived(
    variant === 'toggle' || (variant === 'auto' && locales.length === 2),
  );
  const other = $derived(locales.find((locale) => locale !== current) ?? current);
</script>

{#if isToggle}
  {#if href === undefined}
    <Button
      variant="ghost"
      class={className}
      aria-label={switchLabel(nameOf(other))}
      onclick={() => onSelect?.(other)}
    >
      <span lang={other}>{nameOf(other)}</span>
    </Button>
  {:else}
    <LinkButton
      variant="ghost"
      class={className}
      href={href(other)}
      hreflang={other}
      aria-label={switchLabel(nameOf(other))}
    >
      <span lang={other}>{nameOf(other)}</span>
    </LinkButton>
  {/if}
{:else}
  <DropdownMenu {label} class={className}>
    {#snippet trigger({ props })}
      <Button {...props} variant="ghost" aria-label={`${label}: ${nameOf(current)}`}>
        <span lang={current}>{nameOf(current)}</span>
      </Button>
    {/snippet}
    {#if href === undefined}
      <MenuRadioGroup value={current} onValueChange={(locale) => onSelect?.(locale)}>
        {#each locales as locale (locale)}
          <MenuRadioItem value={locale}><span lang={locale}>{nameOf(locale)}</span></MenuRadioItem>
        {/each}
      </MenuRadioGroup>
    {:else}
      {#each locales as locale (locale)}
        <MenuItem href={href(locale)} current={locale === current}>
          <span lang={locale}>{nameOf(locale)}</span>
        </MenuItem>
      {/each}
    {/if}
  </DropdownMenu>
{/if}
