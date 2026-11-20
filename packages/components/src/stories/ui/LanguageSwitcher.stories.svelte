<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import LanguageSwitcher from '../../lib/ui/LanguageSwitcher.svelte';

  const { Story } = defineMeta({
    title: 'UI/LanguageSwitcher',
    component: LanguageSwitcher,
    parameters: {
      docs: {
        description: {
          component:
            'Changes the UI language. Each locale is named in its own language through `Intl.DisplayNames`. With two locales it is one control naming the other language; with more, a menu. Pass `href` for links that work without JavaScript, or `onSelect` to switch in place.',
        },
      },
    },
  });

  let current = $state('en-AU');
</script>

<Story name="Two locales" asChild>
  <LanguageSwitcher locales={['en-AU', 'es-419']} {current} onSelect={(locale) => (current = locale)} />
</Story>

<Story name="Menu" asChild>
  <LanguageSwitcher
    locales={['en-AU', 'es-419', 'de', 'ja']}
    {current}
    onSelect={(locale) => (current = locale)}
  />
</Story>

<Story name="Links" asChild>
  <LanguageSwitcher
    locales={['en-AU', 'en-GB', 'fr']}
    current="en-AU"
    href={(locale) => `/${locale}/`}
  />
</Story>
