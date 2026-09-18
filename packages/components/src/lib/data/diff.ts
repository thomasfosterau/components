/**
 * The segment shape `DiffText` renders.
 *
 * A `.ts` module rather than a `<script module>` block so the diff algorithm
 * that produces these — which is the app's, not this package's — can import
 * the type without reaching through a component.
 *
 * @module
 */

/** One run of a word- or character-level diff. */
export interface DiffSegment {
  readonly kind: 'equal' | 'insert' | 'delete';
  readonly text: string;
}
