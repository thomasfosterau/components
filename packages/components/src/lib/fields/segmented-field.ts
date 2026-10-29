/**
 * What `DateField` and `TimeField` share when handing their props to bits-ui:
 * the props themselves, and the split between the bits-ui root and the
 * segment group `SegmentGroup` renders.
 *
 * @module
 */

import type { CalendarDateTime, Time, ZonedDateTime } from '@internationalized/date';
import type { HTMLAttributes } from 'svelte/elements';
import { definedProps, firstLocale } from './calendar-props.ts';
import type { FieldSize } from './field-types.ts';

/** A time of day, alone or on a date: what a `TimeField` holds. */
export type TimeValue = Time | CalendarDateTime | ZonedDateTime;

/** The props `DateField` and `TimeField` share: everything but the value, its bounds and the granularity. */
export interface SegmentedFieldProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'placeholder' | 'children' | 'id'
> {
  /** Force a 12- or 24-hour clock; omitted, the locale's. */
  hourCycle?: 12 | 24 | undefined;
  /** Form field name: bits-ui renders a hidden input with the ISO value. */
  name?: string | undefined;
  /** BCP 47 locale(s); the first is used. Falls back to the context's `locale()`. */
  locales?: string | readonly string[] | undefined;
  /**
   * No interaction at all.
   * @defaultValue `false`
   */
  disabled?: boolean | undefined;
  /**
   * Focusable and read out, but the value cannot change.
   * @defaultValue `false`
   */
  readonly?: boolean | undefined;
  /** @defaultValue `'md'` */
  size?: FieldSize | undefined;
  /** `FieldControl`: the segment group's `id`. */
  id?: string | undefined;
  /** `FieldControl`: the visible label's id; the group and each segment are `aria-labelledby` it. */
  labelId?: string | undefined;
  /**
   * `FieldControl`: space-separated ids for the group's `aria-describedby`.
   * @defaultValue `''`
   */
  describedBy?: string | undefined;
  /**
   * `FieldControl`: the field is in error — `aria-invalid` and the error border.
   * @defaultValue `false`
   */
  invalid?: boolean | undefined;
  /**
   * `FieldControl`: a value is required for the form to submit.
   * @defaultValue `false`
   */
  required?: boolean | undefined;
}

/** What `SegmentGroup` renders the group with. */
export interface SegmentGroupOptions {
  readonly id: string | undefined;
  readonly name: string | undefined;
  readonly labelId: string | undefined;
  readonly describedBy: string;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly size: FieldSize;
  /** The caller's remaining attributes, spread onto the group. */
  readonly attributes: Record<string, unknown>;
}

/**
 * Split the shared props into the bits-ui root's options (defaults applied,
 * unset options dropped) and the segment group's. One function, so
 * `DateField` and `TimeField` cannot disagree about a default.
 */
export function segmentedField(
  props: SegmentedFieldProps,
  contextLocale: string | readonly string[] | undefined,
): { readonly root: Record<string, unknown>; readonly group: SegmentGroupOptions } {
  const {
    hourCycle,
    name,
    locales = contextLocale,
    disabled = false,
    readonly = false,
    size = 'md',
    id,
    labelId,
    describedBy = '',
    invalid = false,
    required = false,
    ...attributes
  } = props;
  return {
    root: {
      ...definedProps({ hourCycle, locale: firstLocale(locales) }),
      disabled,
      readonly,
      required,
    },
    group: { id, name, labelId, describedBy, invalid, disabled, size, attributes },
  };
}
