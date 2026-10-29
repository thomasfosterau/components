/**
 * Spec 1.1 range channels (`x2` / `y2`): accepted on a bar with a matching
 * start channel, rejected everywhere else, and absent from spec "1".
 */
import { describe, expect, it } from 'vite-plus/test';
import { parseSpec, SPEC_VERSION, validateSpec } from '../../src/spec/index.ts';

const gantt = {
  specVersion: '1.1',
  mark: 'bar',
  encoding: {
    y: { field: 'task', type: 'nominal' },
    x: { field: 'start', type: 'temporal' },
    x2: { field: 'end', type: 'temporal' },
  },
  data: {
    values: [
      { task: 'Sow tomatoes', start: '2026-09-01', end: '2026-10-15' },
      { task: 'Transplant', start: '2026-10-15', end: '2026-11-01' },
    ],
  },
} as const;

describe('range channels', () => {
  it('the current version is 1.1, and spec "1" documents still parse', () => {
    expect(SPEC_VERSION).toBe('1.1');
    expect(
      validateSpec({
        ...gantt,
        specVersion: '1',
        encoding: { x: gantt.encoding.x, y: gantt.encoding.y },
      }).ok,
    ).toBe(true);
  });

  it('accepts x2 on a bar whose x has the same temporal type, and y2 likewise', () => {
    expect(parseSpec(gantt).encoding.x2).toEqual({ field: 'end', type: 'temporal' });
    const vertical = parseSpec({
      ...gantt,
      encoding: {
        x: { field: 'task', type: 'nominal' },
        y: { field: 'low', type: 'quantitative' },
        y2: { field: 'high', type: 'quantitative' },
      },
    });
    expect(vertical.encoding.y2?.field).toBe('high');
  });

  it.each([
    ['spec version "1"', { ...gantt, specVersion: '1' }, 'need specVersion "1.1"'],
    ['a line mark', { ...gantt, mark: 'line' }, 'only valid with mark "bar"'],
    [
      'a mismatched type',
      { ...gantt, encoding: { ...gantt.encoding, x2: { field: 'end', type: 'quantitative' } } },
      'type must match "x"',
    ],
    [
      'no start channel',
      { ...gantt, encoding: { y: gantt.encoding.y, x2: gantt.encoding.x2 } },
      'needs "x"',
    ],
    [
      'a categorical range',
      {
        ...gantt,
        encoding: {
          ...gantt.encoding,
          x: { field: 'a', type: 'nominal' },
          x2: { field: 'b', type: 'nominal' },
        },
      },
      'quantitative or temporal',
    ],
  ])('rejects %s', (_, spec, message) => {
    const result = validateSpec(spec);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain(message);
  });
});
