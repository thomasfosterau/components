/**
 * The state behind `NavigationStack` and `StackPage`: which way the last
 * navigation went, the view transition that shows it, the titles Back links
 * name, and where focus was on each page so a pop can put it back. The app's
 * router reports each navigation; nothing here imports a router.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';

/** Which way a navigation moves through the stack. */
export type NavigationDirection = 'push' | 'pop' | 'replace';

/** The parts of a navigation the stack reads. SvelteKit's `onNavigate` argument has this shape. */
export interface StackNavigation {
  /** `'popstate'` for browser Back and Forward; anything else is a link or a programmatic navigation. */
  readonly type: string;
  /** For `'popstate'`: how many entries it moved, negative going back. */
  readonly delta?: number | undefined;
  /** Where it goes; `null` when leaving the app. */
  readonly to: { readonly url: URL } | null;
  /** Settles when the new page is in place. */
  readonly complete: Promise<void>;
}

/** What a mounted `StackPage` tells the stack. */
interface StackPageEntry {
  readonly title: string;
  /** The screen's own path, when the caller knows it better than the URL does. */
  readonly href?: string | undefined;
  readonly backHref: string | undefined;
  readonly backLink: () => HTMLAnchorElement | undefined;
}

const CONTEXT_KEY = Symbol('@thomasfosterau/components:navigation-stack');

const pathOf = (href: string): string => new URL(href, window.location.href).pathname;

/** A selector that finds the focused element again on a fresh render of the same page. */
function selectorFor(element: Element | null): string | undefined {
  if (!(element instanceof HTMLElement) || element === document.body) return undefined;
  if (element.id !== '') return `#${CSS.escape(element.id)}`;
  const href = element instanceof HTMLAnchorElement ? element.getAttribute('href') : null;
  return href === null
    ? undefined
    : `a[href="${href.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"]`;
}

/** The navigation stack: create one per app with {@link createNavigationStack}. */
export class NavigationStackState {
  /** The last navigation's direction; `undefined` on the first page load. */
  direction: NavigationDirection | undefined = $state();
  readonly #titles = new Map<string, string>();
  readonly #focus = new Map<string, string>();
  #page: StackPageEntry | undefined;
  #path: string | undefined;
  #arrival: string | undefined;
  #settled: Promise<void> = Promise.resolve();

  /** Which way a navigation goes: browser Back, or a link to the current page's Back target, is a pop. */
  directionOf(navigation: StackNavigation): NavigationDirection {
    if (navigation.type === 'popstate') return (navigation.delta ?? -1) < 0 ? 'pop' : 'push';
    const back = this.#page?.backHref;
    return back !== undefined &&
      navigation.to !== null &&
      navigation.to.url.pathname === pathOf(back)
      ? 'pop'
      : 'push';
  }

  /**
   * Report a navigation, from the router's before-navigate hook. Returns a
   * promise to hand back to SvelteKit's `onNavigate` when a view transition
   * starts, so the old page is captured before the new one renders.
   */
  onNavigate(
    navigation: StackNavigation,
    direction: NavigationDirection = this.directionOf(navigation),
  ): Promise<void> | undefined {
    const selector = selectorFor(document.activeElement);
    if (selector !== undefined) this.#focus.set(this.#path ?? window.location.pathname, selector);
    this.direction = direction;
    this.#arrival = navigation.to?.url.pathname;
    const settle = navigation.complete.catch(() => undefined);
    if (typeof document.startViewTransition !== 'function') {
      this.#settled = settle;
      return undefined;
    }
    const root = document.documentElement;
    root.dataset['stackDirection'] = direction;
    return new Promise((resolve) => {
      const transition = document.startViewTransition(async () => {
        resolve();
        await settle;
      });
      this.#settled = transition.finished
        .catch(() => undefined)
        .finally(() => {
          delete root.dataset['stackDirection'];
        });
    });
  }

  /** Resolves when the last navigation and its transition have finished. */
  settled(): Promise<void> {
    return this.#settled;
  }

  /** A page mounted: record its title and make it current. Returns its path. */
  enter(page: StackPageEntry): string {
    const path =
      page.href === undefined ? (this.#arrival ?? window.location.pathname) : pathOf(page.href);
    this.#titles.set(path, page.title);
    this.#page = page;
    this.#path = path;
    return path;
  }

  /** A page unmounted. */
  leave(page: StackPageEntry): void {
    if (this.#page !== page) return;
    this.#page = undefined;
    this.#path = undefined;
  }

  /** The title of the page at `href`, if it has been shown. */
  titleOf(href: string): string | undefined {
    return this.#titles.get(pathOf(href));
  }

  /** Where focus was when the reader left the page at `path`. */
  focusOn(path: string): string | undefined {
    return this.#focus.get(path);
  }

  /** Go back as the current page's Back link does; `false` when it has none. */
  back(): boolean {
    const link = this.#page?.backLink();
    link?.click();
    return link !== undefined;
  }
}

/** Create the stack and place it in context, from the root layout, during initialisation. */
export function createNavigationStack(): NavigationStackState {
  return setContext(CONTEXT_KEY, new NavigationStackState());
}

/** The stack from context, or `undefined` when none was created. */
export function getNavigationStack(): NavigationStackState | undefined {
  return getContext<NavigationStackState | undefined>(CONTEXT_KEY);
}
