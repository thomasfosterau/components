/**
 * `WheelPicker`'s arithmetic and the time and date wheels' locale-driven
 * columns, tested without the component.
 */

import { CalendarDate, Time } from '@internationalized/date';
import { describe, expect, test } from 'vite-plus/test';
import {
  edgeIndex,
  nearestEnabled,
  numericRange,
  rowAt,
  stepIndex,
  typeaheadIndex,
  wheelKeyTarget,
  type WheelOption,
} from '../../src/lib/fields/wheel.ts';
import {
  dateToWheel,
  dateWheel,
  timeToWheel,
  timeWheel,
  wheelToDate,
  wheelToTime,
} from '../../src/lib/fields/wheel-dates.ts';

const options: WheelOption[] = ['1', '2', '3', '4', '10', '40'].map((value) => ({
  value,
  label: value,
  disabled: value === '3',
}));

describe('wheel arithmetic', () => {
  test('stepIndex skips disabled options, clamps, and wraps with loop', () => {
    expect(stepIndex(options, 1, 1)).toBe(3);
    expect(stepIndex(options, 3, -1)).toBe(1);
    expect(stepIndex(options, 5, 1)).toBe(5);
    expect(stepIndex(options, 5, 1, true)).toBe(0);
    expect(stepIndex(options, 0, -1, true)).toBe(5);
    expect(stepIndex(options, 0, 5)).toBe(5);
  });

  test('edgeIndex and nearestEnabled', () => {
    const fenced = [{ value: 'a', label: 'a', disabled: true }, ...options];
    expect(edgeIndex(fenced, 1)).toBe(1);
    expect(edgeIndex(options, -1)).toBe(5);
    expect(nearestEnabled(options, 2)).toBe(1);
    expect(nearestEnabled([], 0)).toBe(-1);
  });

  test('typeaheadIndex finds the next label starting with the typed text', () => {
    expect(typeaheadIndex(options, 0, '4')).toBe(3);
    expect(typeaheadIndex(options, 3, '4')).toBe(5);
    expect(typeaheadIndex(options, 5, '4')).toBe(3);
    expect(typeaheadIndex(options, 0, '3')).toBe(-1);
  });

  test('rowAt rounds to the nearest row within the list', () => {
    expect(rowAt(0, 40, 6)).toBe(0);
    expect(rowAt(61, 40, 6)).toBe(2);
    expect(rowAt(9_999, 40, 6)).toBe(5);
    expect(rowAt(-20, 40, 6)).toBe(0);
    expect(rowAt(100, 0, 6)).toBe(0);
  });

  test('numericRange only for all-numeric options', () => {
    expect(numericRange(options, '4')).toEqual({ now: 4, min: 1, max: 40 });
    expect(numericRange([{ value: 'kg', label: 'kg' }], 'kg')).toBeUndefined();
    expect(numericRange([], '')).toBeUndefined();
  });
});

describe('time wheel', () => {
  test('en-US has an AM/PM column after hours and minutes, 1 to 12', () => {
    const { columns, separators } = timeWheel({ locales: 'en-US' });
    expect(columns.map((column) => column.id)).toEqual(['hour', 'minute', 'dayPeriod']);
    expect(separators[0]).toBe(':');
    expect(columns[0]?.options.map((option) => option.label).slice(0, 2)).toEqual(['1', '2']);
    expect(columns[2]?.options.map((option) => option.label)).toEqual(['AM', 'PM']);
  });

  test('a 24-hour clock has no AM/PM column; minutes follow minuteStep', () => {
    const { columns } = timeWheel({ locales: 'en-AU', hourCycle: 24, minuteStep: 5 });
    expect(columns.map((column) => column.id)).toEqual(['hour', 'minute']);
    expect(columns[0]?.options[0]?.label).toBe('00');
    expect(columns[1]?.options.map((option) => option.label).slice(0, 3)).toEqual([
      '00',
      '05',
      '10',
    ]);
  });

  test('ko-KR puts the day period first', () => {
    expect(timeWheel({ locales: 'ko-KR' }).columns[0]?.id).toBe('dayPeriod');
  });

  test('converts both ways on either clock', () => {
    expect(timeToWheel(new Time(0, 7), true, 5)).toEqual({
      hour: '12',
      minute: '5',
      dayPeriod: 'am',
    });
    expect(timeToWheel(new Time(13, 30), false)).toEqual({ hour: '13', minute: '30' });
    expect(wheelToTime({ hour: '12', minute: '5', dayPeriod: 'am' }).toString()).toBe('00:05:00');
    expect(wheelToTime({ hour: '1', minute: '0', dayPeriod: 'pm' }).toString()).toBe('13:00:00');
    expect(wheelToTime({ hour: '9', minute: '15' }).toString()).toBe('09:15:00');
  });
});

describe('date wheel', () => {
  const min = new CalendarDate(2026, 2, 10);
  const max = new CalendarDate(2027, 12, 31);

  test('orders columns by locale and sizes days to the month', () => {
    const us = dateWheel({ locales: 'en-US', min, max, date: new CalendarDate(2026, 4, 1) });
    expect(us.columns.map((column) => column.id)).toEqual(['month', 'day', 'year']);
    expect(us.columns[1]?.options).toHaveLength(30);
    const au = dateWheel({ locales: 'en-AU', min, max, date: new CalendarDate(2026, 4, 1) });
    expect(au.columns.map((column) => column.id)).toEqual(['day', 'month', 'year']);
    expect(au.columns[1]?.options[3]?.label).toBe('April');
  });

  test('disables days and months outside the range', () => {
    const { columns } = dateWheel({
      locales: 'en-AU',
      min,
      max,
      date: new CalendarDate(2026, 2, 15),
    });
    const days = columns.find((column) => column.id === 'day')?.options ?? [];
    const months = columns.find((column) => column.id === 'month')?.options ?? [];
    expect(days.filter((day) => day.disabled).map((day) => day.value)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ]);
    expect(months[0]?.disabled).toBe(true);
    expect(months[1]?.disabled).toBe(false);
  });

  test('clamps the day to the month and the date to the range', () => {
    expect(wheelToDate({ day: '31', month: '4', year: '2026' }, min, max).toString()).toBe(
      '2026-04-30',
    );
    expect(wheelToDate({ day: '1', month: '1', year: '2026' }, min, max)).toEqual(min);
    expect(dateToWheel(new CalendarDate(2026, 3, 4))).toEqual({
      day: '4',
      month: '3',
      year: '2026',
    });
  });
});

const key = (
  name: string,
  modifiers: Partial<KeyboardEvent> = {},
): Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey'> => ({
  key: name,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  ...modifiers,
});

test('wheelKeyTarget maps keys to moves, typing, or nothing', () => {
  expect(wheelKeyTarget(options, 0, key('ArrowDown'))).toBe(1);
  expect(wheelKeyTarget(options, 0, key('ArrowUp'), true)).toBe(5);
  expect(wheelKeyTarget(options, 0, key('PageDown'))).toBe(5);
  expect(wheelKeyTarget(options, 5, key('PageUp'))).toBe(0);
  expect(wheelKeyTarget(options, 2, key('Home'))).toBe(0);
  expect(wheelKeyTarget(options, 2, key('End'))).toBe(5);
  expect(wheelKeyTarget(options, 0, key('4'))).toBe('type');
  expect(wheelKeyTarget(options, 0, key('Tab'))).toBeUndefined();
  expect(wheelKeyTarget(options, 0, key('a', { ctrlKey: true }))).toBeUndefined();
});
