import { describe, expect, test } from 'vite-plus/test';
import {
  clamp,
  decimalPlaces,
  formatNumber,
  numberSymbols,
  parseNumber,
  roundTo,
  valuePrecision,
} from '../../src/lib/fields/number-format.ts';

describe('round-trips its own output', () => {
  const cases: readonly [string, number, Intl.NumberFormatOptions | undefined][] = [
    ['en-AU', 1234.5, undefined],
    ['de-DE', 1234.5, undefined],
    ['fr-FR', 1234567.25, undefined],
    ['hi-IN', 1234567.5, undefined],
    ['en-AU', -42.75, undefined],
    ['de-DE', 12.5, { style: 'unit', unit: 'centimeter' }],
    ['en-AU', 0.45, { style: 'percent' }],
    ['fr-FR', 0.07, { style: 'percent' }],
    ['en-AU', 1999.99, { style: 'currency', currency: 'AUD' }],
    ['de-DE', 1999.99, { style: 'currency', currency: 'EUR' }],
  ];
  test.each(cases)('%s %d %o', (locale, value, options) => {
    expect(parseNumber(formatNumber(value, locale, options), locale, options)).toBe(value);
  });
});

test('learns each locale’s separators', () => {
  expect(numberSymbols('en-AU')).toMatchObject({ group: ',', decimal: '.' });
  expect(numberSymbols('de-DE')).toMatchObject({ group: '.', decimal: ',' });
  expect(numberSymbols('fr-FR').decimal).toBe(',');
  expect(numberSymbols('fr-FR').group.trim()).toBe('');
});

test('parses what a reader types, not only what the formatter wrote', () => {
  expect(parseNumber('1.234,5', 'de-DE')).toBe(1234.5);
  expect(parseNumber('1,5', 'de-DE')).toBe(1.5);
  expect(parseNumber('1 234,5', 'fr-FR')).toBe(1234.5);
  expect(parseNumber('12,34,567.5', 'hi-IN')).toBe(1234567.5);
  expect(parseNumber('45', 'en-AU', { style: 'percent' })).toBe(0.45);
  expect(parseNumber('12 cm', 'en-AU', { style: 'unit', unit: 'centimeter' })).toBe(12);
  expect(parseNumber('−3', 'en-AU')).toBe(-3);
});

test('empty is undefined, garbage is NaN', () => {
  expect(parseNumber('', 'en-AU')).toBeUndefined();
  expect(parseNumber('   ', 'en-AU')).toBeUndefined();
  expect(parseNumber('abc', 'en-AU')).toBeNaN();
  expect(parseNumber('1.2.3', 'en-AU')).toBeNaN();
});

test('formatNumber renders undefined as empty', () => {
  expect(formatNumber(undefined, 'en-AU')).toBe('');
});

test('precision helpers', () => {
  expect(decimalPlaces(5)).toBe(0);
  expect(decimalPlaces(0.25)).toBe(2);
  expect(decimalPlaces(1e-7)).toBe(7);
  expect(roundTo(0.1 + 0.2, 2)).toBe(0.3);
  expect(valuePrecision(1, 'en-AU')).toBe(3);
  expect(valuePrecision(0.0001, 'en-AU')).toBe(4);
  expect(valuePrecision(1, 'en-AU', { style: 'percent' })).toBe(2);
  expect(clamp(5, 0, 3)).toBe(3);
  expect(clamp(-1, 0, undefined)).toBe(0);
  expect(clamp(7, undefined, undefined)).toBe(7);
});
