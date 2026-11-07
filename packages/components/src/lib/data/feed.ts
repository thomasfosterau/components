/**
 * The ARIA *Feed* pattern's keyboard contract, shared by `ItemList`'s feed
 * mode and `VirtualList`'s `semantics="feed"`: with focus on an article or
 * anything inside one, Page Down moves focus to the next article and Page Up
 * to the previous one.
 *
 * `feedStep` is the key mapping alone, because the two callers find "the next
 * article" differently: `ItemList` has every article in the DOM and steps to
 * a sibling (`moveFeedFocus`), while `VirtualList` steps by index and may
 * have to scroll the neighbour into existence first.
 *
 * Not exported from the family barrel: it is the components' shared
 * implementation, not a public API.
 *
 * @module
 */

/** A control that owns Page Up / Page Down itself, so the feed leaves it alone. */
function ownsPageKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLInputElement && target.type !== 'checkbox' && target.type !== 'radio')
  );
}

/**
 * Which way a keydown moves focus through a feed: `1` for Page Down, `-1` for
 * Page Up, `undefined` for anything else — a modified key, or a page key typed
 * into a control that scrolls its own content.
 */
export function feedStep(event: KeyboardEvent): 1 | -1 | undefined {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return undefined;
  if (ownsPageKeys(event.target)) return undefined;
  if (event.key === 'PageDown') return 1;
  if (event.key === 'PageUp') return -1;
  return undefined;
}

/**
 * The feed's keydown handler when every article is a direct child of `feed`:
 * focus the neighbouring article (scrolled into view by `focus()`), and
 * swallow the key so the page does not scroll as well.
 */
export function moveFeedFocus(event: KeyboardEvent, feed: HTMLElement): void {
  const step = feedStep(event);
  const { target } = event;
  if (step === undefined || !(target instanceof Element)) return;
  const articles = [...feed.querySelectorAll<HTMLElement>(':scope > article')];
  const current = articles.findIndex((article) => article.contains(target));
  if (current === -1) return;
  const next = articles[current + step];
  if (next === undefined) return;
  event.preventDefault();
  next.focus();
}
