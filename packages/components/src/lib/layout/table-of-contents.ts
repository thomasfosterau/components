/**
 * The data side of `TableOfContents`: entries collected from a page's
 * headings, and nested by level into the tree the component renders.
 *
 * @module
 */

/** One section in a table of contents. */
export interface TocEntry {
  /** The target heading's `id`. */
  readonly id: string;
  readonly label: string;
  /** The heading level, `2` to `6`; deeper levels nest under shallower ones. */
  readonly level: number;
}

/** A `TocEntry` with the entries nested under it. */
export interface TocNode extends TocEntry {
  readonly children: readonly TocNode[];
}

/** Heading levels a table of contents can list. */
export type TocLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Nest a flat, document-ordered list by level: an entry belongs under the
 * nearest earlier entry with a lower level. A skipped level (an `h4` straight
 * after an `h2`) nests one step, not two.
 */
export const nestEntries = (entries: readonly TocEntry[]): TocNode[] => {
  const root: { level: number; children: TocNode[] } = { level: 0, children: [] };
  const stack: { level: number; children: TocNode[] }[] = [root];
  for (const entry of entries) {
    while (stack.length > 1 && (stack.at(-1)?.level ?? 0) >= entry.level) stack.pop();
    const node = { ...entry, children: [] as TocNode[] };
    stack.at(-1)?.children.push(node);
    stack.push(node);
  }
  return root.children;
};

/** A heading's text without its permalink (`Heading`'s `anchor`) or other in-page links. */
const headingText = (heading: Element): string => {
  const copy = heading.cloneNode(true);
  if (!(copy instanceof Element)) return '';
  for (const link of copy.querySelectorAll('a[href^="#"]')) link.remove();
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
};

/** The headings at `levels` inside `root` that have an `id`, in document order. */
export const collectHeadings = (root: ParentNode, levels: readonly TocLevel[]): TocEntry[] => {
  if (levels.length === 0) return [];
  const selector = levels.map((level) => `h${level}[id]`).join(', ');
  return Array.from(root.querySelectorAll(selector), (heading) => ({
    id: heading.id,
    label: headingText(heading),
    level: Number(heading.tagName.slice(1)),
  })).filter((entry) => entry.id !== '' && entry.label !== '');
};
