/**
 * How an {@link AccordionItem} learns its enclosing `Accordion`'s settings.
 *
 * `headingLevel`, `variant`, `joined`, `searchable` and the open state are
 * the group's, never an item's: an item reads them from context so a stack
 * cannot drift into mixed heading levels or markers. Getters, not values, so
 * a change to the `Accordion`'s props reaches every item.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';
import type { DisclosureVariant, HeadingLevel } from './tones.ts';

const ACCORDION_KEY = Symbol.for('@thomasfosterau/components/accordion');

/** What an `Accordion` lends its items. */
export interface AccordionContext {
  readonly headingLevel: () => HeadingLevel;
  readonly variant: () => DisclosureVariant;
  readonly joined: () => boolean;
  readonly searchable: () => boolean;
  /** Whether the item with this value is open. */
  readonly isOpen: (value: string) => boolean;
  /** Whether closing this open item is refused (`type="single"` with `required`). */
  readonly isLocked: (value: string) => boolean;
}

/** Lend `context` to the `AccordionItem`s below. */
export function setAccordionContext(context: AccordionContext): void {
  setContext(ACCORDION_KEY, context);
}

/** The enclosing `Accordion`'s settings; throws outside one, where an item has no group to belong to. */
export function getAccordionContext(): AccordionContext {
  const context = getContext<AccordionContext | undefined>(ACCORDION_KEY);
  if (context === undefined) throw new Error('AccordionItem must be rendered inside an Accordion.');
  return context;
}
