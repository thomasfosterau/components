/**
 * Minor-version degradation (#304): a newer `1.N` document is read as the
 * newest version this interpreter knows, its unknown keys ignored and
 * reported, and an unknown mark carried as `unsupported`; `'1'` and `'1.1'`
 * stay strict, and another major is rejected.
 */
import { describe, expect, it } from 'vite-plus/test';
import { errorsOf } from './errors-of.ts';
import {
  parseSpec,
  SPEC_VERSION,
  SpecValidationError,
  UnsupportedMarkError,
  validateSpec,
} from '../../src/spec/index.ts';

const future = {
  specVersion: '1.2',
  mark: 'bar',
  encoding: {
    x: { field: 'fruit', type: 'nominal' },
    y: { field: 'count', type: 'quantitative' },
    shape: { field: 'fruit', type: 'nominal' },
  },
  data: { values: [{ fruit: 'apple', count: 3 }] },
  config: { title: 'Fruit', subtitle: 'by count' },
  facet: { row: 'fruit' },
} as const;

/** `future` without its unknown keys. */
const known = {
  specVersion: '1.1',
  mark: 'bar',
  encoding: { x: future.encoding.x, y: future.encoding.y },
  data: future.data,
} as const;

describe('a newer 1.N spec', () => {
  it('parses, strips unknown keys and reports each by path', () => {
    const result = validateSpec(future);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      specVersion: SPEC_VERSION,
      mark: 'bar',
      encoding: { x: future.encoding.x, y: future.encoding.y },
      data: future.data,
      config: { title: 'Fruit' },
    });
    expect(result.degradation).toEqual({
      declaredVersion: '1.2',
      ignored: ['["encoding"]["shape"]', '["config"]["subtitle"]', '["facet"]'],
    });
    expect(parseSpec(future)).toEqual(result.value);
  });

  it('reports an empty ignored list when every key is known', () => {
    const result = validateSpec({ ...known, specVersion: '1.10' });
    expect(result.ok && result.degradation).toEqual({ declaredVersion: '1.10', ignored: [] });
  });

  it('accepts any minor above the newest known one', () => {
    for (const specVersion of ['1.2', '1.10', '1.99']) {
      const result = validateSpec({ ...future, specVersion });
      expect(result.ok && result.degradation?.declaredVersion).toBe(specVersion);
    }
  });

  it('still rejects what it knows but is invalid, with the strict messages', () => {
    const errors = errorsOf(
      validateSpec({ ...future, encoding: { ...future.encoding, x: { field: 1 } } }),
    );
    expect(errors.join('\n')).toContain('["encoding"]["x"]');
    // A known cross-field rule holds as in 1.1.
    expect(
      errorsOf(
        validateSpec({
          ...future,
          mark: 'line',
          encoding: { ...future.encoding, x2: { field: 'fruit', type: 'nominal' } },
        }),
      ).join('\n'),
    ).toContain('range channels are only valid with mark "bar"');
  });

  it('carries an unknown mark as unsupported, with its known fields', () => {
    const sankey = { ...future, mark: 'sankey', tree: { orientation: 'horizontal' } };
    const result = validateSpec(sankey);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      '["mark"]: "sankey" is not a mark this interpreter knows (the spec declares specVersion "1.2")',
    ]);
    expect(result.unsupported).toEqual({
      spec: {
        specVersion: SPEC_VERSION,
        mark: 'sankey',
        encoding: { x: future.encoding.x, y: future.encoding.y },
        data: future.data,
        config: { title: 'Fruit' },
      },
      degradation: {
        declaredVersion: '1.2',
        ignored: ['["encoding"]["shape"]', '["config"]["subtitle"]', '["facet"]', '["tree"]'],
      },
    });
  });

  it('parseSpec throws an UnsupportedMarkError (a SpecValidationError) for an unknown mark', () => {
    const thrown = (() => {
      try {
        parseSpec({ ...future, mark: 'sankey' });
      } catch (error) {
        return error;
      }
      return undefined;
    })();
    expect(thrown).toBeInstanceOf(UnsupportedMarkError);
    expect(thrown).toBeInstanceOf(SpecValidationError);
    if (!(thrown instanceof UnsupportedMarkError)) return;
    expect(thrown.name).toBe('UnsupportedMarkError');
    expect(thrown.unsupported.spec.mark).toBe('sankey');
  });

  it('an unknown mark whose known fields are invalid is a plain error', () => {
    const result = validateSpec({ ...future, mark: 'sankey', data: { values: 'nope' } });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.unsupported).toBeUndefined();
    expect(result.errors.join('\n')).toContain('["data"]');
  });
});

describe('versions that do not degrade', () => {
  it.each(['1', '1.1'])('stays strict for %j: unknown keys and marks are errors', (specVersion) => {
    expect(validateSpec({ ...future, specVersion }).ok).toBe(false);
    expect(validateSpec({ ...known, specVersion, mark: 'sankey' })).toEqual({
      ok: false,
      errors: [expect.stringContaining('["mark"]')],
    });
    expect(validateSpec({ ...known, specVersion })).toEqual({
      ok: true,
      value: { ...known, specVersion },
    });
  });

  it.each(['2', '2.0', '1.1.1', '1.', '1.02', '01.2', 'v1.2', ' 1.2', '0.9'])(
    'rejects specVersion %j',
    (specVersion) => {
      const result = validateSpec({ ...future, specVersion });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.unsupported).toBeUndefined();
      expect(result.errors.join('\n')).toContain('["specVersion"]');
    },
  );
});
