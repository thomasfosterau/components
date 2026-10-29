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
