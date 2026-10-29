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

/**
 * The two writers bits-ui's toggle-group `bind:value` needs, for single and
 * multiple mode. In single mode `''` (the selected item pressed off) is
 * refused when `required()`. Otherwise the value goes to `assign` and then
 * to `notify()`. `ToggleGroup` and `ToolbarToggleGroup` share it, so
 * `required` means the same in both.
 */
export function toggleSetters<V extends string>(options: {
  readonly required: () => boolean;
  readonly assign: (value: V | '' | V[]) => void;
  readonly notify: () => ((value: never) => void) | undefined;
}): { readonly single: (next: string) => void; readonly multiple: (next: string[]) => void } {
  // SAFETY: bits-ui only ever reports values of the group's own items, or ''.
  const write = (next: V | '' | V[]): void => {
    options.assign(next);
    (options.notify() as ((value: V | '' | V[]) => void) | undefined)?.(next);
  };
  return {
    single: (next) => {
      if (options.required() && next === '') return;
      write(next as V | '');
    },
    multiple: (next) => write(next as V[]),
  };
}
