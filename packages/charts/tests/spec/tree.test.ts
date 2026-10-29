/**
 * Spec 1.1 `tree` mark: the channels it needs and the ones it refuses.
 */
import { describe, expect, it } from 'vite-plus/test';
import { validateSpec } from '../../src/spec/index.ts';

const tree = {
  specVersion: '1.1',
  mark: 'tree',
  encoding: {
    id: { field: 'id', type: 'nominal' },
    parent: { field: 'parent', type: 'nominal' },
  },
  data: { values: [{ id: 'a', parent: null }] },
  tree: { orientation: 'horizontal', linkStyle: 'curved' },
} as const;

describe('tree mark', () => {
  it('parses with id, parent and tree options', () => {
    expect(validateSpec(tree).ok).toBe(true);
  });

  it.each([
    ['spec version "1"', { ...tree, specVersion: '1' }, '"tree" needs specVersion "1.1"'],
    [
      'no parent channel',
      { ...tree, encoding: { id: tree.encoding.id } },
      'needs a parent channel',
    ],
    [
      'an x channel',
      { ...tree, encoding: { ...tree.encoding, x: { field: 'a', type: 'nominal' } } },
      'takes no "x"',
    ],
    [
      'an id channel on a bar',
      {
        ...tree,
        mark: 'bar',
        tree: undefined,
        encoding: {
          ...tree.encoding,
          x: { field: 'a', type: 'nominal' },
          y: { field: 'b', type: 'quantitative' },
        },
      },
      '["id"]: only valid with mark "tree"',
    ],
    [
      'tree options on a bar',
      {
        ...tree,
        mark: 'bar',
        encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
      },
      '["tree"]: only valid with mark "tree"',
    ],
    ['an unknown tree option', { ...tree, tree: { spacing: 4 } }, 'spacing'],
  ])('rejects %s', (_, spec, message) => {
    const input = Object.fromEntries(
      Object.entries(spec).filter(([, value]) => value !== undefined),
    );
    const result = validateSpec(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain(message);
  });
});
