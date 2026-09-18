/**
 * Unit tests for undo and redo over a `VectorDocument`.
 *
 * The whole mechanism is four pure functions over plain data, so this is where
 * the interesting claims live: that a transform applied and then inverted is
 * the identity, that `batch` really does cover a mixed edit rather than being
 * the case nobody implemented, and that recording clears the redo stack.
 *
 * @module tests/canvas/history
 */

import { describe, expect, it } from 'vitest';
import {
  applyTransform,
  diffTransform,
  emptyHistory,
  HISTORY_LIMIT,
  invertTransform,
  recordEdit,
  redo,
  undo,
} from '../../src/lib/canvas/history.ts';
import type { CanvasElement, Transform, VectorDocument } from '../../src/lib/canvas/types.ts';

const element = (id: string, x: number): CanvasElement => ({
  id,
  type: 'node',
  position: { x, y: 0 },
  rotation: 0,
  zIndex: 0,
  strokeColor: '',
  strokeWidth: 1,
  fillColor: '',
  opacity: 1,
  locked: false,
});

const docOf = (...elements: readonly CanvasElement[]): VectorDocument => ({
  version: '1',
  metadata: {},
  viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
  grid: { visible: false, size: 10, snap: false, color: '' },
  elements,
});

const ids = (doc: VectorDocument): readonly string[] => doc.elements.map((node) => node.id);

describe('applying a transform', () => {
  const a = element('a', 0);
  const b = element('b', 10);

  it('adds, updates and deletes by the one rule', () => {
    const added = applyTransform(docOf(a), { type: 'add', elementIds: ['b'], elements: [b] });
    expect(ids(added)).toEqual(['a', 'b']);

    const updated = applyTransform(docOf(a, b), {
      type: 'update',
      elementIds: ['a'],
      elements: [element('a', 99)],
      previousElements: [a],
    });
    expect(updated.elements[0]?.position.x).toBe(99);

    const deleted = applyTransform(docOf(a, b), { type: 'delete', elementIds: ['a'] });
    expect(ids(deleted)).toEqual(['b']);
  });

  it('covers a mixed batch — one id gone, one arrived, one changed', () => {
    const c = element('c', 20);
    const next = applyTransform(docOf(a, b), {
      type: 'batch',
      elementIds: ['a', 'b', 'c'],
      elements: [element('b', 77), c],
      previousElements: [a, b],
    });
    expect(ids(next)).toEqual(['b', 'c']);
    expect(next.elements[0]?.position.x).toBe(77);
  });

  it('leaves untouched elements identical, not merely equal', () => {
    const next = applyTransform(docOf(a, b), {
      type: 'update',
      elementIds: ['a'],
      elements: [element('a', 5)],
    });
    expect(next.elements[1]).toBe(b);
  });

  it('does not read previousElements — applying does not depend on the document it was recorded against', () => {
    const transform: Transform = {
      type: 'update',
      elementIds: ['a'],
      elements: [element('a', 3)],
      previousElements: [element('a', 1000)],
    };
    expect(applyTransform(docOf(element('a', 42)), transform).elements[0]?.position.x).toBe(3);
  });
});

describe('inverting a transform', () => {
  const a = element('a', 0);

  it('round-trips a document through apply and apply-inverse', () => {
    const before = docOf(a, element('b', 10));
    const transform = diffTransform(before.elements, [element('a', 55)]);
    const after = applyTransform(before, transform);
    expect(applyTransform(after, invertTransform(transform))).toEqual(before);
  });

  it('exchanges add and delete so an entry still reads as what it did', () => {
    expect(invertTransform({ type: 'add', elementIds: ['a'], elements: [a] }).type).toBe('delete');
    expect(invertTransform({ type: 'delete', elementIds: ['a'], previousElements: [a] }).type).toBe(
      'add',
    );
    expect(invertTransform({ type: 'batch', elementIds: [] }).type).toBe('batch');
  });
});

describe('diffTransform', () => {
  const a = element('a', 0);
  const b = element('b', 10);

  it('names the type from the two sets', () => {
    expect(diffTransform([], [a]).type).toBe('add');
    expect(diffTransform([a], []).type).toBe('delete');
    expect(diffTransform([a], [element('a', 1)]).type).toBe('update');
    expect(diffTransform([a], [b]).type).toBe('batch');
  });

  it('names every id either side touches, once', () => {
    expect(diffTransform([a, b], [b]).elementIds).toEqual(['a', 'b']);
  });
});

describe('the undo stack', () => {
  const a = element('a', 0);
  const doc = docOf(a);
  const move = diffTransform([a], [element('a', 50)]);

  it('has nothing to undo or redo when it is empty', () => {
    expect(undo(doc, emptyHistory())).toEqual([]);
    expect(redo(doc, emptyHistory())).toEqual([]);
  });

  it('walks back and forward again', () => {
    const history = recordEdit(emptyHistory(), move, 'move', 0);
    const moved = applyTransform(doc, move);

    const [back] = undo(moved, history);
    expect(back?.doc.elements[0]?.position.x).toBe(0);
    expect(back?.history.past).toHaveLength(0);
    expect(back?.history.future).toHaveLength(1);

    const [forward] = redo(back?.doc ?? doc, back?.history ?? history);
    expect(forward?.doc.elements[0]?.position.x).toBe(50);
    expect(forward?.history.future).toHaveLength(0);
  });

  it('clears the redo stack when a new edit is recorded — the futures were of another document', () => {
    const history = recordEdit(emptyHistory(), move, 'move', 0);
    const [back] = undo(applyTransform(doc, move), history);
    const diverged = recordEdit(back?.history ?? history, diffTransform([a], []), 'delete', 0);
    expect(diverged.future).toEqual([]);
    expect(diverged.past).toHaveLength(1);
  });

  it('keeps a description and a timestamp on the entry', () => {
    const [entry] = recordEdit(emptyHistory(), move, 'move the shape', 1234).past;
    expect(entry?.description).toBe('move the shape');
    expect(entry?.timestamp).toBe(1234);
  });

  it('omits the description rather than storing an empty one', () => {
    const [entry] = recordEdit(emptyHistory(), move, '', 0).past;
    expect(entry !== undefined && 'description' in entry).toBe(false);
  });

  it('drops the oldest entry past the limit rather than growing without bound', () => {
    let history = emptyHistory();
    for (let step = 0; step < HISTORY_LIMIT + 5; step += 1) {
      history = recordEdit(history, diffTransform([a], [element('a', step)]), `${step}`, 0);
    }
    expect(history.past).toHaveLength(HISTORY_LIMIT);
    expect(history.past[0]?.description).toBe('5');
  });
});
