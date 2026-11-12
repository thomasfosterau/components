/**
 * The pressed / unpressed look `ToggleButton` and `ToggleGroup` share, and the `ToggleGroup` item type.
 *
 * Pressed is never colour alone: the unpressed `variant` (ghost, outline…)
 * is dropped for a filled tone plus daisyUI's `btn-active`, so the two
 * states differ in fill and depth as well as hue.
 *
 * @module
 */

import type { Snippet } from 'svelte';
import { buttonTone, buttonVariant, type ButtonVariant, type Tone } from './tones.ts';

/** The classes of a toggle in `pressed` state, besides `btn` and the size. */
export function toggleClasses(pressed: boolean, tone: Tone, variant: ButtonVariant): string {
  return pressed ? `${buttonTone[tone]} btn-active` : buttonVariant[variant];
}

/** One item of a `ToggleGroup`. */
export interface ToggleGroupItem<Value extends string = string> {
  readonly value: Value;
  /** The item's accessible name, shown unless `iconOnly`. */
  readonly label: string;
  /** Leading icon. */
  readonly icon?: Snippet<[]> | undefined;
  /** Hide the label visually; it stays the accessible name. */
  readonly iconOnly?: boolean | undefined;
  readonly disabled?: boolean | undefined;
}

/** `notify` is only the single-mode handler when `type` says so. */
const handlesSingle = (
  notify: (value: never) => void,
  type: 'single' | 'multiple',
): notify is (value: string) => void => type === 'single';
const handlesMultiple = (
  notify: (value: never) => void,
  type: 'single' | 'multiple',
): notify is (value: string[]) => void => type === 'multiple';

/**
 * The two writers bits-ui's toggle-group `bind:value` needs, for single and
 * multiple mode. In single mode `''` (the selected item pressed off) is
 * refused when `required()`. Otherwise the value goes to `assign` and then
 * to the mode's notifier. `ToggleGroup` and `ToolbarToggleGroup` share it, so
 * `required` means the same in both. bits-ui reports plain strings; only
 * those that are one of `values()` are passed on, so the typed callbacks
 * never see a value the group does not own.
 */
/** The props of a toggle group that its setters read, at call time. */
export interface ToggleGroupSource<V extends string> {
  readonly items: readonly { readonly value: V }[];
  readonly required: boolean;
  readonly type: 'single' | 'multiple';
  readonly onValueChange: ((value: never) => void) | undefined;
}

export function toggleSetters<V extends string>(
  source: () => ToggleGroupSource<V>,
  assign: (value: V | '' | V[]) => void,
): { readonly single: (next: string) => void; readonly multiple: (next: string[]) => void } {
  // `onValueChange` is the callback of a `single | multiple` props union, so
  // TypeScript only lets it be called with `never`; `type` is the
  // discriminant, and the predicates above carry it to the call site.
  const isValue = (candidate: string): candidate is V =>
    source().items.some((entry) => entry.value === candidate);
  const accepts = (candidate: string): candidate is V | '' =>
    candidate === '' ? !source().required : isValue(candidate);
  return {
    single: (next) => {
      if (!accepts(next)) return;
      assign(next);
      const { onValueChange: notify, type } = source();
      if (notify && handlesSingle(notify, type)) notify(next);
    },
    multiple: (next) => {
      const values = next.filter(isValue);
      assign(values);
      const { onValueChange: notify, type } = source();
      if (notify && handlesMultiple(notify, type)) notify(values);
    },
  };
}
