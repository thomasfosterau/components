/**
 * The ARIA *Feed* pattern's keyboard contract, shared by `ItemList`'s feed
 * mode and `VirtualList`'s `semantics="feed"`: with focus on an article or
 * anything inside one, Page Down moves focus to the next article and Page Up
 * to the previous one; Ctrl+End moves it to the first focusable element
 * after the feed, and Ctrl+Home to the last one before it (APG's optional
 * keys), so a reader can leave a long feed without paging through it.
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
 * focus the neighbouring article (scrolled into view by `focus()`), or leave
 * the feed on Ctrl+Home / Ctrl+End, and swallow the key so the page does not
 * scroll as well.
 */
export function moveFeedFocus(event: KeyboardEvent, feed: HTMLElement): void {
  if (leaveFeed(event, feed)) return;
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

/** What can take keyboard focus, for the Ctrl+Home / Ctrl+End escape. */
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ');

/**
 * Where a keydown leaves the feed to: `'after'` for Ctrl+End, `'before'` for
 * Ctrl+Home, `undefined` for anything else — including those keys in a
 * control that moves its own caret with them.
 */
export function feedEscape(event: KeyboardEvent): 'before' | 'after' | undefined {
  if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return undefined;
  if (ownsPageKeys(event.target)) return undefined;
  if (event.key === 'End') return 'after';
  if (event.key === 'Home') return 'before';
  return undefined;
}

/** Tab-reachable: not `tabindex="-1"`, rendered, and not inside an `inert` subtree. */
function reachable(element: Element): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.tabIndex >= 0 &&
    element.closest('[inert]') === null &&
    element.getClientRects().length > 0
  );
}

/**
 * Handle Ctrl+Home / Ctrl+End on `feed`: focus the nearest tab-reachable
 * element before or after it, in document order, and swallow the key.
 * Returns whether it did. The lookup goes by the feed element's own place in
 * the document, never by its articles, so a windowed feed whose far articles
 * are not rendered escapes the same way. With nothing focusable on that side
 * the key is left to the browser.
 */
export function leaveFeed(event: KeyboardEvent, feed: HTMLElement): boolean {
  const direction = feedEscape(event);
  if (direction === undefined) return false;
  const outside = [...document.querySelectorAll(FOCUSABLE)].filter(
    (element): element is HTMLElement => !feed.contains(element) && reachable(element),
  );
  const side =
    direction === 'after' ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING;
  const onSide = outside.filter((element) => (feed.compareDocumentPosition(element) & side) !== 0);
  const destination = direction === 'after' ? onSide[0] : onSide[onSide.length - 1];
  if (destination === undefined) return false;
  event.preventDefault();
  destination.focus();
  return true;
}
