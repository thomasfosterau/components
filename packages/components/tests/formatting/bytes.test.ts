import { describe, expect, test } from 'vite-plus/test';
import { formatBytes, formatExactBytes, scaleBytes } from '../../src/lib/formatting/bytes.ts';

describe('formatBytes, file style (SI)', () => {
  test.each([
    [0, '0 bytes'],
    [1, '1 byte'],
    [999, '999 bytes'],
    [1000, '1 kB'],
    [999_999, '1 MB'],
    [999_950, '1 MB'],
    [1_000_000, '1 MB'],
    [4_200_000, '4.2 MB'],
    [1.5e12, '1.5 TB'],
    [-4_200_000, '-4.2 MB'],
  ])('%d → %s', (bytes, expected) => {
    expect(formatBytes(bytes, {}, 'en-AU')).toBe(expected);
  });

  test('localises the number and the unit', () => {
    expect(formatBytes(4_200_000, {}, 'de-DE')).toBe('4,2 MB');
  });

  test('long and narrow unit display', () => {
    expect(formatBytes(4_200_000, { unitDisplay: 'long' }, 'en-AU')).toBe('4.2 megabytes');
    expect(formatBytes(4_200_000, { unitDisplay: 'narrow' }, 'en-AU')).toBe('4.2MB');
  });

  test('allowedUnits', () => {
    expect(formatBytes(500_000, { allowedUnits: ['megabyte'] }, 'en-AU')).toBe('0.5 MB');
    expect(formatBytes(4_200_000_000, { allowedUnits: ['megabyte'] }, 'en-AU')).toBe('4,200 MB');
  });

  test('NaN and infinities give an empty string', () => {
    expect(formatBytes(Number.NaN)).toBe('');
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('');
  });
});

describe('formatBytes, memory style (IEC)', () => {
  test('base 1024 with IEC labels', () => {
    expect(formatBytes(1_048_576, { style: 'memory' }, 'en-AU')).toBe('1 MiB');
    expect(formatBytes(1536, { style: 'memory', maximumFractionDigits: 1 }, 'en-AU')).toBe(
      '1.5 KiB',
    );
    expect(formatBytes(1024, { style: 'memory', unitDisplay: 'long' }, 'en-AU')).toBe('1 kibibyte');
    expect(formatBytes(2_097_152, { style: 'memory', unitDisplay: 'long' }, 'en-AU')).toBe(
      '2 mebibytes',
    );
  });

  test('labels are replaceable for another language', () => {
    const iecUnits = {
      byte: 'o',
      kilobyte: 'Kio',
      megabyte: 'Mio',
      gigabyte: 'Gio',
      terabyte: 'Tio',
      petabyte: 'Pio',
    };
    expect(formatBytes(1_048_576, { style: 'memory', iecUnits }, 'fr-FR')).toBe('1 Mio');
  });
});

test('scaleBytes picks the unit from the rounded value', () => {
  expect(scaleBytes(999).unit).toBe('byte');
  expect(scaleBytes(1000).unit).toBe('kilobyte');
  expect(scaleBytes(999_499).unit).toBe('kilobyte');
  expect(scaleBytes(999_950).unit).toBe('megabyte');
});

test('formatExactBytes writes the count out', () => {
  expect(formatExactBytes(4_200_000, 'en-AU')).toBe('4,200,000 bytes');
});
