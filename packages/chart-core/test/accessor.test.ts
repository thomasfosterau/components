import { describe, expect, it } from 'vitest';
import { makeAccessor } from '../src/index.ts';

describe('makeAccessor', () => {
  describe('quantitative', () => {
    const accessor = makeAccessor({ field: 'value', type: 'quantitative' });

    it('returns finite numbers', () => {
      expect(accessor({ value: 42 })).toBe(42);
      expect(accessor({ value: -1.5 })).toBe(-1.5);
      expect(accessor({ value: 0 })).toBe(0);
    });

    it('returns null for missing fields and nulls', () => {
      expect(accessor({})).toBeNull();
      expect(accessor({ value: null })).toBeNull();
      expect(accessor({ other: 1 })).toBeNull();
    });

    it('throws when the value contradicts the declared type', () => {
      expect(() => accessor({ value: 'not a number' })).toThrow(TypeError);
      expect(() => accessor({ value: true })).toThrow(TypeError);
    });
  });

  describe('temporal', () => {
    const accessor = makeAccessor({ field: 'date', type: 'temporal' });

    it('parses ISO 8601 strings into Dates', () => {
      const result = accessor({ date: '2024-03-15T12:00:00Z' });
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).toISOString()).toBe('2024-03-15T12:00:00.000Z');
    });

    it('parses date-only ISO strings', () => {
      const result = accessor({ date: '2024-03-15' });
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).getTime()).toBe(Date.UTC(2024, 2, 15));
    });

    it('parses epoch milliseconds', () => {
      const epoch = Date.UTC(2024, 0, 1);
      const result = accessor({ date: epoch });
      expect((result as Date).getTime()).toBe(epoch);
    });

    it('returns null for missing fields and nulls', () => {
      expect(accessor({})).toBeNull();
      expect(accessor({ date: null })).toBeNull();
    });

    it('throws on unparseable temporal values (never sniffs or guesses)', () => {
      expect(() => accessor({ date: 'not a date' })).toThrow(TypeError);
      expect(() => accessor({ date: true })).toThrow(TypeError);
    });
  });

  describe('nominal and ordinal', () => {
    it('returns category strings', () => {
      const accessor = makeAccessor({ field: 'category', type: 'nominal' });
      expect(accessor({ category: 'apples' })).toBe('apples');
    });

    it('stringifies non-string categories (e.g. years as numbers)', () => {
      const accessor = makeAccessor({ field: 'year', type: 'ordinal' });
      expect(accessor({ year: 2024 })).toBe('2024');
      expect(accessor({ year: true })).toBe('true');
    });

    it('returns null for missing fields and nulls', () => {
      const accessor = makeAccessor({ field: 'category', type: 'nominal' });
      expect(accessor({})).toBeNull();
      expect(accessor({ category: null })).toBeNull();
    });
  });
});
