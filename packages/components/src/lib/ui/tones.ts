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

export type ButtonVariant = 'solid' | 'outline' | 'soft' | 'dash' | 'ghost' | 'link';
export type BadgeVariant = 'solid' | 'outline' | 'soft' | 'dash' | 'ghost';
export type AlertVariant = 'solid' | 'soft' | 'outline' | 'dash';

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

export const buttonVariant: Record<ButtonVariant, string> = {
  solid: '',
  outline: 'btn-outline',
  soft: 'btn-soft',
  dash: 'btn-dash',
  ghost: 'btn-ghost',
  link: 'btn-link',
};

export const buttonSize: Record<Size, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-xl',
};

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

export const badgeVariant: Record<BadgeVariant, string> = {
  solid: '',
  outline: 'badge-outline',
  soft: 'badge-soft',
  dash: 'badge-dash',
  ghost: 'badge-ghost',
};

export const badgeSize: Record<Size, string> = {
  xs: 'badge-xs',
  sm: 'badge-sm',
  md: 'badge-md',
  lg: 'badge-lg',
  xl: 'badge-xl',
};

export const alertTone: Record<StatusTone, string> = {
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error',
};

export const alertVariant: Record<AlertVariant, string> = {
  solid: '',
  soft: 'alert-soft',
  outline: 'alert-outline',
  dash: 'alert-dash',
};

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
