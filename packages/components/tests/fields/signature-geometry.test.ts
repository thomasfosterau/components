import { describe, expect, test } from 'vite-plus/test';
import { strokePath, strokesToSvg, thin, typedToSvg } from '../../src/lib/fields/signature.ts';

describe('thin', () => {
  test('drops points closer than the minimum to the last kept one', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0.1, y: 0 },
      { x: 1, y: 0 },
      { x: 1.2, y: 0 },
      { x: 3, y: 0 },
    ];
    expect(thin(points)).toEqual([points[0], points[2], points[4]]);
  });
});

describe('strokePath', () => {
  test('a curve through every point, with no NaN', () => {
    const path = strokePath([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 0 },
      { x: 30, y: 10 },
    ]);
    expect(path.startsWith('M0 0C')).toBe(true);
    expect(path).not.toContain('NaN');
    expect(path.match(/C/g)).toHaveLength(3);
    expect(path.endsWith('30 10')).toBe(true);
  });

  test('a single point is a dot; no points is no path', () => {
    expect(strokePath([{ x: 5, y: 5 }])).toBe('M5 5l0 0.1');
    expect(strokePath([])).toBe('');
  });
});

describe('export', () => {
  test('strokes become one path each in a fixed ink', () => {
    const svg = strokesToSvg(
      [
        [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
        ],
        [{ x: 9, y: 9 }],
      ],
      { aspect: 3, strokeWidth: 2 },
    );
    expect(svg).toContain('viewBox="0 0 300 100"');
    expect(svg.match(/<path/g)).toHaveLength(2);
    expect(svg).toContain('stroke="#1f2937"');
  });

  test('a typed name is escaped', () => {
    expect(typedToSvg('A & <B>', { aspect: 2 })).toContain('>A &amp; &lt;B&gt;</text>');
  });
});
