import * as Schema from 'effect/Schema';

// The `typeof X.Type` aliases below deliberately share their names with the
// public mirror types in `../types.ts`: `tests/spec/type-parity.test.ts`
// asserts each pair equal. Neither barrel re-exports this module.
// fallow-ignore-file duplicate-export

/**
 * The mark set: the intersection of the native charting vocabularies
 * (Swift Charts BarMark/LineMark/PointMark/AreaMark and Compose
 * equivalents), plus `tree` (spec 1.1), the first mark outside it: laid
 * out by the core, with a normative degradation in every interpreter.
 */
export const Mark = Schema.Literals(['bar', 'line', 'point', 'area', 'tree']).annotate({
  identifier: 'Mark',
  description:
    'The mark (geometric primitive) used to render the chart. The native-charting intersection, ' +
    'plus "tree" (spec 1.1): a hierarchy laid out by the interpreter.',
});

/** Layout options of the `tree` mark (spec 1.1). Grammar-level only: no pixels. */
export const TreeOptions = Schema.Struct({
  orientation: Schema.optionalKey(
    Schema.Literals(['vertical', 'horizontal']).annotate({
      description: 'Vertical: roots at the top. Horizontal: roots at the start edge.',
    }),
  ),
  linkStyle: Schema.optionalKey(
    Schema.Literals(['orthogonal', 'curved']).annotate({
      description: 'How a parent joins its children.',
    }),
  ),
}).annotate({
  identifier: 'TreeOptions',
  description: 'Spec 1.1: layout options of the "tree" mark. Only valid with mark "tree".',
});

/** The decoded type of {@link TreeOptions}; the public mirror is `TreeOptions` in `../types.ts`. */
export type TreeOptions = typeof TreeOptions.Type;

/** The decoded type of {@link Mark}; the public mirror is `Mark` in `../types.ts`. */
export type Mark = typeof Mark.Type;
