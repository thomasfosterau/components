/**
 * ui — buttons, badges, surfaces and small interactive affordances.
 *
 * The family every other family builds on: `Alert` is what a form's errors
 * surface in, `Card` is the surface a section is drawn on, `Button` is what
 * a dialog's actions are. Import from the package barrel rather than from
 * here — this file is the family's own index, and the public surface is
 * `src/lib/index.ts`.
 *
 * One convention worth stating once: every optional prop in this family is
 * declared `T | undefined`, not bare `T`. The workspace compiles with
 * `exactOptionalPropertyTypes`, under which `prop?: T` rejects an explicitly
 * passed `undefined` — so a caller forwarding its own optional prop
 * (`<Button {tone}>` where `tone?: Tone`) would not compile. Widening the
 * declaration is what makes these primitives composable by the other
 * families.
 *
 * @module
 */

export { default as Accordion } from './Accordion.svelte';
export { default as AccordionItem } from './AccordionItem.svelte';
export { default as Alert } from './Alert.svelte';
export { default as Badge } from './Badge.svelte';
export { default as Button } from './Button.svelte';
export { default as Card } from './Card.svelte';
export { default as Chip } from './Chip.svelte';
export { default as ConfirmButton } from './ConfirmButton.svelte';
export { default as Disclosure } from './Disclosure.svelte';
export { default as Divider } from './Divider.svelte';
export { default as DropdownMenu } from './DropdownMenu.svelte';
export { default as EmptyState } from './EmptyState.svelte';
export { default as ExternalLink } from './ExternalLink.svelte';
export { default as Heading } from './Heading.svelte';
export { default as Link } from './Link.svelte';
export { default as LinkButton } from './LinkButton.svelte';
export { default as Menu } from './Menu.svelte';
export { default as MenuCheckboxItem } from './MenuCheckboxItem.svelte';
export { default as MenuItem } from './MenuItem.svelte';
export { default as MenuRadioGroup } from './MenuRadioGroup.svelte';
export { default as MenuRadioItem } from './MenuRadioItem.svelte';
export { default as MenuSeparator } from './MenuSeparator.svelte';
export { default as MenuSub } from './MenuSub.svelte';
export { default as Popover } from './Popover.svelte';
export { default as ShareButton } from './ShareButton.svelte';
export { default as Skeleton } from './Skeleton.svelte';
export { default as Spinner } from './Spinner.svelte';
export { default as ThemeToggle } from './ThemeToggle.svelte';
export { default as ToggleButton } from './ToggleButton.svelte';
export { default as ToggleGroup } from './ToggleGroup.svelte';
export { default as Tooltip } from './Tooltip.svelte';
export { default as VisuallyHidden } from './VisuallyHidden.svelte';

export * from './colour-token.ts';
export * from './menu-context.ts';
export * from './slug.ts';
export * from './tones.ts';
export type { ToggleGroupItem } from './toggle-classes.ts';
