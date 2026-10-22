import * as Schema from 'effect/Schema';

// The `typeof X.Type` aliases below deliberately share their names with the
// public mirror types in `../types.ts`: `tests/spec/type-parity.test.ts`
// asserts each pair equal. Neither barrel re-exports this module.
// fallow-ignore-file duplicate-export

/**
 * The v1 mark set: the intersection of the native charting vocabularies
 * (Swift Charts BarMark/LineMark/PointMark/AreaMark and Compose equivalents).
 */
export const Mark = Schema.Literals(['bar', 'line', 'point', 'area']).annotate({
  identifier: 'Mark',
  description:
    'The mark (geometric primitive) used to render the chart. ' +
    'Restricted to the intersection of native charting vocabularies.',
});

/** The decoded type of {@link Mark}; the public mirror is `Mark` in `../types.ts`. */
export type Mark = typeof Mark.Type;
