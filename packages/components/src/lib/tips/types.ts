/**
 * TipKit types — contextual, dismissible guidance, after Apple's TipKit.
 *
 * @module
 */

/** How often a tip may reappear once it has been shown. */
export type TipFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'once';

/** Where a tip has got to in its life. */
export type TipStatus = 'pending' | 'available' | 'dismissed' | 'completed';

/** Which side of its anchor a popover tip sits on. */
export type TipPlacement = 'top' | 'bottom' | 'left' | 'right';

/** A condition that must hold for a tip to show. */
export interface TipRule {
  readonly id: string;
  /** Synchronous on purpose — see the note in `tip-store.svelte.ts`. */
  readonly evaluate: () => boolean;
}

/** Something the reader can do from the tip. */
export interface TipAction {
  readonly id: string;
  readonly title: string;
  readonly handler: () => void | Promise<void>;
}

/** A tip, as declared by the page that owns it. */
export interface TipConfig {
  readonly id: string;
  readonly title: string;
  readonly message?: string;
  readonly actions?: readonly TipAction[];
  /** Every rule must hold. */
  readonly rules?: readonly TipRule[];
  /** Defaults to `immediate` — shown every time the page is visited. */
  readonly frequency?: TipFrequency;
  /** Never shown more than this many times, whatever the frequency says. */
  readonly maxDisplayCount?: number;
}

/** What is remembered about a tip between visits. */
export interface TipState {
  readonly id: string;
  readonly status: TipStatus;
  readonly displayCount: number;
  /** ISO 8601; absent until the tip has been shown once. */
  readonly lastShown?: string;
  readonly dismissedAt?: string;
  readonly completedAt?: string;
}
