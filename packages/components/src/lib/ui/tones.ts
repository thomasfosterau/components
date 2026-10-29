/**
 * The daisyUI semantic vocabulary and the literal class tables that map it
 * onto each component.
 *
 * The tables exist because Tailwind only generates classes it can see
 * verbatim in source: a template-string `btn-${tone}` produces nothing at
 * build time. So every tone / variant / size class is spelled out once here
 * as a `Record<K, string>` and looked up, never interpolated. Add a table
 * here rather than a second copy in a component.
 *
 * @module
 */

/** daisyUI semantic colours. */
export type Tone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

/** The status subset daisyUI's `alert` supports. */
export type StatusTone = 'info' | 'success' | 'warning' | 'error';

/** daisyUI size steps. */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** The daisyUI `btn` styles. */
export type ButtonVariant = 'solid' | 'outline' | 'soft' | 'dash' | 'ghost' | 'link';
/** The daisyUI `badge` styles. */
export type BadgeVariant = 'solid' | 'outline' | 'soft' | 'dash' | 'ghost';
/** The daisyUI `alert` styles. */
export type AlertVariant = 'solid' | 'soft' | 'outline' | 'dash';

/** Literal daisyUI class per `Tone` for `Button`; a lookup table so Tailwind's scanner sees every class. */
export const buttonTone: Record<Tone, string> = {
  neutral: 'btn-neutral',
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  info: 'btn-info',
  success: 'btn-success',
  warning: 'btn-warning',
  error: 'btn-error',
};

/** Literal daisyUI class per `ButtonVariant` for `Button`; a lookup table so Tailwind's scanner sees every class. */
export const buttonVariant: Record<ButtonVariant, string> = {
  solid: '',
  outline: 'btn-outline',
  soft: 'btn-soft',
  dash: 'btn-dash',
  ghost: 'btn-ghost',
  link: 'btn-link',
};

/** Literal daisyUI class per `Size` for `Button`; a lookup table so Tailwind's scanner sees every class. */
export const buttonSize: Record<Size, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-xl',
};

/** Literal daisyUI class per `Tone` for `Badge`; a lookup table so Tailwind's scanner sees every class. */
export const badgeTone: Record<Tone, string> = {
  neutral: 'badge-neutral',
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  accent: 'badge-accent',
  info: 'badge-info',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
};

/** Literal daisyUI class per `BadgeVariant` for `Badge`; a lookup table so Tailwind's scanner sees every class. */
export const badgeVariant: Record<BadgeVariant, string> = {
  solid: '',
  outline: 'badge-outline',
  soft: 'badge-soft',
  dash: 'badge-dash',
  ghost: 'badge-ghost',
};

/** Literal daisyUI class per `Size` for `Badge`; a lookup table so Tailwind's scanner sees every class. */
export const badgeSize: Record<Size, string> = {
  xs: 'badge-xs',
  sm: 'badge-sm',
  md: 'badge-md',
  lg: 'badge-lg',
  xl: 'badge-xl',
};

/** Literal daisyUI class per `StatusTone` for `Alert`; a lookup table so Tailwind's scanner sees every class. */
export const alertTone: Record<StatusTone, string> = {
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error',
};

/** Literal daisyUI class per `AlertVariant` for `Alert`; a lookup table so Tailwind's scanner sees every class. */
export const alertVariant: Record<AlertVariant, string> = {
  solid: '',
  soft: 'alert-soft',
  outline: 'alert-outline',
  dash: 'alert-dash',
};

/** Literal daisyUI class per `Tone` for `ProgressBar`; a lookup table so Tailwind's scanner sees every class. */
export const progressTone: Record<Tone, string> = {
  neutral: 'progress-neutral',
  primary: 'progress-primary',
  secondary: 'progress-secondary',
  accent: 'progress-accent',
  info: 'progress-info',
  success: 'progress-success',
  warning: 'progress-warning',
  error: 'progress-error',
};

/**
 * Literal daisyUI class per `Tone` for `Steps`; a lookup table so Tailwind's scanner sees every class.
 * Two adjacent toned steps colour the connector between them too.
 */
export const stepTone: Record<Tone, string> = {
  neutral: 'step-neutral',
  primary: 'step-primary',
  secondary: 'step-secondary',
  accent: 'step-accent',
  info: 'step-info',
  success: 'step-success',
  warning: 'step-warning',
  error: 'step-error',
};

/**
 * Literal daisyUI class per `Tone` for `Slider`; a lookup table so Tailwind's scanner sees every class.
 * Each sets `color` (the fill, read as `currentColor`) and `--range-thumb` (the thumb face).
 */
export const rangeTone: Record<Tone, string> = {
  neutral: 'range-neutral',
  primary: 'range-primary',
  secondary: 'range-secondary',
  accent: 'range-accent',
  info: 'range-info',
  success: 'range-success',
  warning: 'range-warning',
  error: 'range-error',
};

/** Where a `Divider`'s label sits along the rule. */
export type DividerAlign = 'start' | 'center' | 'end';

/** Literal daisyUI class per `Tone` for `Divider`; a lookup table so Tailwind's scanner sees every class. */
export const dividerTone: Record<Tone, string> = {
  neutral: 'divider-neutral',
  primary: 'divider-primary',
  secondary: 'divider-secondary',
  accent: 'divider-accent',
  info: 'divider-info',
  success: 'divider-success',
  warning: 'divider-warning',
  error: 'divider-error',
};

/** Literal daisyUI class per `DividerAlign` for `Divider`; a lookup table so Tailwind's scanner sees every class. */
export const dividerAlign: Record<DividerAlign, string> = {
  start: 'divider-start',
  center: '',
  end: 'divider-end',
};

/**
 * Literal daisyUI class per rule direction for `Divider`. daisyUI names the
 * LAYOUT, not the rule: `divider-horizontal` sits between side-by-side items
 * and so draws a vertical rule. This table hides the inversion behind the
 * direction the rule actually runs.
 */
export const dividerOrientation: Record<'horizontal' | 'vertical', string> = {
  horizontal: 'divider-vertical',
  vertical: 'divider-horizontal',
};

/** The daisyUI `loading` shapes `Spinner` draws. */
export type SpinnerVariant = 'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity';

/** Literal daisyUI class per `SpinnerVariant` for `Spinner`; a lookup table so Tailwind's scanner sees every class. */
export const loadingVariant: Record<SpinnerVariant, string> = {
  spinner: 'loading-spinner',
  dots: 'loading-dots',
  ring: 'loading-ring',
  ball: 'loading-ball',
  bars: 'loading-bars',
  infinity: 'loading-infinity',
};

/** Literal daisyUI class per `Size` for `Spinner`; a lookup table so Tailwind's scanner sees every class. */
export const loadingSize: Record<Size, string> = {
  xs: 'loading-xs',
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
  xl: 'loading-xl',
};

/** Plain background classes, for a segment or swatch without a component prefix. */
export const backgroundTone: Record<Tone, string> = {
  neutral: 'bg-neutral',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

/** Text colour classes, the foreground half of {@link backgroundTone}. */
export const textTone: Record<Tone, string> = {
  neutral: 'text-neutral',
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
};

/** Heading levels, for any component that renders a caller-chosen heading. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** The three link weights: `primary` (coloured), `muted` and `plain` (dimmed text). */
export type LinkVariant = 'primary' | 'muted' | 'plain';

/** Literal daisyUI class per `LinkVariant` for `Link`; a lookup table so Tailwind's scanner sees every class. */
export const linkVariant: Record<LinkVariant, string> = {
  primary: 'link link-primary link-hover',
  muted: 'link link-hover',
  plain: 'link link-hover text-base-content/70',
};

/** The daisyUI `card` border styles. */
export type CardVariant = 'border' | 'dash' | 'plain';

/** Literal daisyUI class per `CardVariant` for `Card`; a lookup table so Tailwind's scanner sees every class. */
export const cardVariant: Record<CardVariant, string> = {
  border: 'card-border',
  dash: 'card-dash',
  plain: '',
};

/** Literal daisyUI class per `Size` for `Card`; a lookup table so Tailwind's scanner sees every class. */
export const cardSize: Record<Size, string> = {
  xs: 'card-xs',
  sm: 'card-sm',
  md: 'card-md',
  lg: 'card-lg',
  xl: 'card-xl',
};

/** The `Disclosure` expand marker: an arrow, a plus, or none. */
export type DisclosureVariant = 'arrow' | 'plus' | 'plain';

/** daisyUI `collapse` markers — the affordance on a native `<details>`. */
export const collapseVariant: Record<DisclosureVariant, string> = {
  arrow: 'collapse-arrow',
  plus: 'collapse-plus',
  plain: '',
};

/** The two chip steps. A chip is a dense inline unit, so it stops at `md`. */
export type ChipSize = 'sm' | 'md';

/** Literal gap and text-size classes per `ChipSize`; a lookup table so Tailwind's scanner sees every class. */
export const chipSize: Record<ChipSize, string> = {
  sm: 'gap-1 text-xs',
  md: 'gap-1.5 text-sm',
};

/** The swatch square beside a chip's label, sized to match {@link chipSize}. */
export const chipSwatchSize: Record<ChipSize, string> = {
  sm: 'size-2',
  md: 'size-2.5',
};

/** Which side the items behind a `Stack`'s top item peek out from. */
export type StackDirection = 'top' | 'bottom' | 'start' | 'end';

/** Literal daisyUI class per `StackDirection` for `Stack`; a lookup table so Tailwind's scanner sees every class. */
export const stackDirection: Record<StackDirection, string> = {
  top: 'stack-top',
  bottom: 'stack-bottom',
  start: 'stack-start',
  end: 'stack-end',
};

/** Literal daisyUI class per `Tone` for `ChatBubble`; a lookup table so Tailwind's scanner sees every class. */
export const chatBubbleTone: Record<Tone, string> = {
  neutral: 'chat-bubble-neutral',
  primary: 'chat-bubble-primary',
  secondary: 'chat-bubble-secondary',
  accent: 'chat-bubble-accent',
  info: 'chat-bubble-info',
  success: 'chat-bubble-success',
  warning: 'chat-bubble-warning',
  error: 'chat-bubble-error',
};
