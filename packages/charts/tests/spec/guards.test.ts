import { describe, expect, it } from 'vitest';
import { isDataRef, isInlineData, type Data } from '../../src/spec/index.ts';

describe('data guards', () => {
  const inline: Data = { values: [{ x: 1 }] };
  const ref: Data = { ref: { kind: 'url', id: 'https://example.com/data.json' } };

  it('isInlineData', () => {
    expect(isInlineData(inline)).toBe(true);
    expect(isInlineData(ref)).toBe(false);
  });

  it('isDataRef', () => {
    expect(isDataRef(ref)).toBe(true);
    expect(isDataRef(inline)).toBe(false);
  });
});
