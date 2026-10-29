/**
 * A shared `tree` spec (spec 1.1): a family, two genera, three species,
 * coloured by whether the garden grows them. Depth-first order:
 * Solanaceae, Solanum, S. lycopersicum, S. melongena, Capsicum, C. annuum.
 */
import { parseSpec } from '../../src/spec/index.ts';

export const TAXONOMY_ORDER = [
  'Solanaceae',
  'Solanum',
  'S. lycopersicum',
  'S. melongena',
  'Capsicum',
  'C. annuum',
] as const;

export const taxonomy = parseSpec({
  specVersion: '1.1',
  mark: 'tree',
  encoding: {
    id: { field: 'id', type: 'nominal' },
    parent: { field: 'parent', type: 'nominal' },
    label: { field: 'name', type: 'nominal' },
    color: { field: 'status', type: 'nominal' },
  },
  data: {
    values: [
      { id: 'solanaceae', parent: null, name: 'Solanaceae', status: 'family' },
      { id: 'solanum', parent: 'solanaceae', name: 'Solanum', status: 'genus' },
      { id: 'tomato', parent: 'solanum', name: 'S. lycopersicum', status: 'grown' },
      { id: 'aubergine', parent: 'solanum', name: 'S. melongena', status: 'grown' },
      { id: 'capsicum', parent: 'solanaceae', name: 'Capsicum', status: 'genus' },
      { id: 'chilli', parent: 'capsicum', name: 'C. annuum', status: 'grown' },
    ],
  },
  config: { title: 'Nightshades' },
});

/** The labels of a rendered nested list, in document order. */
export function listOrder(html: string): string[] {
  return [...html.matchAll(/<li>([^<,]+)/g)].map((match) => (match[1] ?? '').trim());
}
