/**
 * The app-integration seam.
 *
 * A component here must not import `$app/*`: that would tie the package to
 * SvelteKit and make it untestable outside one. The four things an app has
 * to supply — how a path becomes an href, how to navigate, which href is the
 * current page, and which locale `Intl` should format for — are read from
 * this injected context instead. It carries NO copy: every user-facing
 * string a component renders is a prop with an English default, so an i18n
 * app passes its own messages at the call site.
 *
 * The app calls {@link setComponentsContext} once in its root layout. When
 * no provider is mounted — unit tests, Storybook, a plain Svelte app —
 * {@link defaultComponentsContext} supplies identity hrefs, `window.location`
 * for navigation and the current-page check, and the runtime's default
 * locale, so every component works unwired.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';

/** What an app supplies through `setComponentsContext`: link resolution, navigation, the current-page check and the formatting locale. */
export interface ComponentsContext {
  /**
   * The locale(s) `Intl` formatters use when a component is given none.
   * `undefined` means the runtime default. A function, not a value, so a
   * reactive i18n runtime is re-read on every render.
   */
  readonly locale: () => string | readonly string[] | undefined;
  /** Resolve an app-relative path (`/books/1`) to the href to render. */
  readonly href: (path: string) => string;
  /** Client-side navigation (SvelteKit's `goto` in an app). */
  readonly navigate: (url: string) => Promise<void> | void;
  /** Whether `href` is the page currently shown — drives `aria-current="page"`. */
  readonly isCurrent: (href: string) => boolean;
}

const hasWindow = (): boolean => typeof globalThis.window !== 'undefined';

/** The pathname of the document currently shown, or `''` off the client. */
const currentPathname = (): string => (hasWindow() ? globalThis.window.location.pathname : '');

/** The context used when no provider is mounted. */
export const defaultComponentsContext: ComponentsContext = {
  locale: () => undefined,
  href: (path) => path,
  navigate: (url) => {
    if (hasWindow()) globalThis.window.location.assign(url);
  },
  isCurrent: (href) => href !== '' && href === currentPathname(),
};

const CONTEXT_KEY = Symbol('@thomasfosterau/components:context');

/**
 * Provide the app-integration context. Call once, high in the tree (the root
 * layout). Omitted members — or members passed as `undefined` — fall back to
 * {@link defaultComponentsContext} individually.
 */
export function setComponentsContext(context: {
  readonly [K in keyof ComponentsContext]?: ComponentsContext[K] | undefined;
}): void {
  setContext<ComponentsContext>(CONTEXT_KEY, {
    locale: context.locale ?? defaultComponentsContext.locale,
    href: context.href ?? defaultComponentsContext.href,
    navigate: context.navigate ?? defaultComponentsContext.navigate,
    isCurrent: context.isCurrent ?? defaultComponentsContext.isCurrent,
  });
}

/** Read the app-integration context, falling back to {@link defaultComponentsContext}. */
export function getComponentsContext(): ComponentsContext {
  return getContext<ComponentsContext | undefined>(CONTEXT_KEY) ?? defaultComponentsContext;
}
