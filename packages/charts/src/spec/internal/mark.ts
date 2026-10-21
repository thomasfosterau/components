import { Schema } from 'effect';

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
