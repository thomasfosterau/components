/**
 * Endonyms for a language switcher: each locale named in its own language,
 * through `Intl.DisplayNames`, so no app keeps a hand-written map.
 *
 * @module
 */

/** The base language of a BCP 47 tag (`es-419` → `es`), or the tag itself if it is not one. */
const baseLanguage = (locale: string): string => {
  try {
    return new Intl.Locale(locale).language;
  } catch {
    return locale;
  }
};

/** The first letter upper-cased in the locale's own rules: `español` → `Español`. */
const capitalise = (name: string, locale: string): string =>
  name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);

/**
 * Name each locale in its own language. The region is dropped (`en-AU` →
 * `English`) unless two of the given locales share a language, when it is
 * what tells them apart (`en-AU` and `en-GB` → `Australian English` and
 * `British English`, in the runtime's wording). `names` overrides any entry; a locale
 * `Intl.DisplayNames` cannot name falls back to its tag.
 */
export function languageEndonyms(
  locales: readonly string[],
  names: Readonly<Record<string, string>> = {},
): ReadonlyMap<string, string> {
  const bases = locales.map(baseLanguage);
  return new Map(
    locales.map((locale, index): [string, string] => {
      const override = names[locale];
      if (override !== undefined) return [locale, override];
      const base = bases[index] ?? locale;
      const shared = bases.filter((other) => other === base).length > 1;
      try {
        const name = new Intl.DisplayNames([locale], { type: 'language' }).of(
          shared ? locale : base,
        );
        return [locale, name === undefined ? locale : capitalise(name, locale)];
      } catch {
        return [locale, locale];
      }
    }),
  );
}
