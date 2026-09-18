/**
 * Undo and redo over a {@link VectorDocument}, as pure functions on the
 * {@link Transform} and {@link HistoryEntry} types `./types.ts` already
 * declares.
 *
 * Those two types were written for exactly this; `Transform`'s own comment is
 * the specification — "carrying the previous elements alongside the new ones is
 * what makes a transform invertible — undo is the same structure read
 * backwards, rather than a second code path". This module takes it at its word,
 * so there is no second structure to keep in step with the first.
 *
 * **Transforms, not snapshots.** A history of whole documents is bounded by the
 * size of the PLAN; a history of transforms is bounded by the size of the
 * EDITS. A plan with four hundred elements would otherwise cost four hundred
 * elements per keystroke.
 *
 * @module @thomasfosterau/components/canvas/history
 */

import type { CanvasElement, HistoryEntry, Transform, VectorDocument } from './types.ts';

/**
 * How many steps back an editing session can walk.
 *
 * Capped rather than unbounded: a plan editor is a long-lived page, and an
 * unbounded stack is a leak that only shows up in the session that matters. A
 * hundred is well past what a reader walks back by hand.
 */
export const HISTORY_LIMIT = 100;

/** The undo and redo stacks; the caller owns them, as it owns the document. */
export interface History<T extends CanvasElement = CanvasElement> {
  /** Oldest first; the last entry is the one `undo` takes back. */
  readonly past: readonly HistoryEntry<T>[];
  /** Nearest first; the first entry is the one `redo` puts back. */
  readonly future: readonly HistoryEntry<T>[];
}

/** A session with nothing to undo. */
export const emptyHistory = <T extends CanvasElement>(): History<T> => ({ past: [], future: [] });

/**
 * A transform's meaning, for every one of the four `type`s:
 * **every id in `elementIds` ends as its entry in `elements`, or absent when
 * `elements` has none for it.**
 *
 * `add`, `update` and `delete` are the narrow cases of that one rule (absent
 * before, present both, present before) and `batch` is the mixed one. Naming
 * them separately is for the reader and for a history entry's `description`;
 * the arithmetic below does not branch on `type` at all, which is why a
 * mixed `batch` cannot be the case somebody forgot to handle.
 *
 * `previousElements` is not read here — it is what {@link invertTransform}
 * needs, and reading it would make applying a transform depend on the document
 * it was recorded against still being the current one.
 *
 * A re-added element is APPENDED rather than restored to its old index. Paint
 * order is `zIndex`'s job (`sortByZIndex`), so the array's order carries no
 * meaning to preserve.
 */
export const applyTransform = <T extends CanvasElement>(
  doc: VectorDocument<T>,
  transform: Transform<T>,
): VectorDocument<T> => {
  const touched = new Set(transform.elementIds);
  const next = new Map((transform.elements ?? []).map((element) => [element.id, element]));
  const present = new Set(doc.elements.map((element) => element.id));
  const kept = doc.elements.flatMap((element) => {
    if (!touched.has(element.id)) return [element];
    const replacement = next.get(element.id);
    return replacement === undefined ? [] : [replacement];
  });
  const added = (transform.elements ?? []).filter((element) => !present.has(element.id));
  return { ...doc, elements: [...kept, ...added] };
};

/**
 * The transform that undoes this one: the two element lists swapped, and
 * `add` and `delete` exchanged so a history entry still reads as what it did.
 *
 * Both lists are written as arrays even when the original omitted one, so the
 * result is a transform whose own inverse is the original — `invert(invert(t))`
 * differs from `t` only in carrying `[]` where `t` carried nothing.
 */
export const invertTransform = <T extends CanvasElement>(
  transform: Transform<T>,
): Transform<T> => ({
  type: transform.type === 'add' ? 'delete' : transform.type === 'delete' ? 'add' : transform.type,
  elementIds: transform.elementIds,
  elements: transform.previousElements ?? [],
  previousElements: transform.elements ?? [],
});

/**
 * The history with one edit pushed on.
 *
 * Recording CLEARS the redo stack, which is the standard rule and the only
 * honest one: once the document has diverged, the futures recorded against the
 * old one describe a document that no longer exists.
 *
 * `timestamp` is a parameter rather than a `Date.now()` call inside, so this
 * stays a pure function a test can pin.
 */
export const recordEdit = <T extends CanvasElement>(
  history: History<T>,
  transform: Transform<T>,
  description = '',
  timestamp: number = Date.now(),
): History<T> => {
  const entry: HistoryEntry<T> = {
    transform,
    timestamp,
    ...(description === '' ? {} : { description }),
  };
  const past = [...history.past, entry];
  return { past: past.slice(Math.max(0, past.length - HISTORY_LIMIT)), future: [] };
};

/**
 * The transform from one set of elements to another, both keyed by id.
 *
 * This is how a component that has just changed a document reports WHAT it
 * changed without keeping a parallel log: snapshot the elements a gesture is
 * about when it starts, read them again when it ends, and the difference is the
 * history entry. A gesture that touched one element costs one element, however
 * many pointer moves it took.
 *
 * The `type` is named from the two sets — absent before is an `add`, absent
 * after a `delete`, a mix a `batch` — so an entry's `type` still reads as what
 * the reader did even though {@link applyTransform} does not branch on it.
 */
export const diffTransform = <T extends CanvasElement>(
  before: readonly T[],
  after: readonly T[],
): Transform<T> => {
  const gone = before.some((element) => !after.some((other) => other.id === element.id));
  const fresh = after.some((element) => !before.some((other) => other.id === element.id));
  const ids = [...new Set([...before, ...after].map((element) => element.id))];
  return {
    type: gone && fresh ? 'batch' : gone ? 'delete' : fresh ? 'add' : 'update',
    elementIds: ids,
    elements: after,
    previousElements: before,
  };
};

/** A document and the history that goes with it, after a step in either direction. */
export interface HistoryStep<T extends CanvasElement = CanvasElement> {
  readonly doc: VectorDocument<T>;
  readonly history: History<T>;
}

/**
 * The document one step back, or nothing when there is nothing to undo.
 *
 * None-or-one rather than a nullable result, for `boundingBox`'s reason: the
 * caller writes `const [step] = undo(...)` and the empty case needs no
 * sentinel to remember to check.
 */
export const undo = <T extends CanvasElement>(
  doc: VectorDocument<T>,
  history: History<T>,
): readonly HistoryStep<T>[] => {
  const entry = history.past.at(-1);
  if (entry === undefined) return [];
  return [
    {
      doc: applyTransform(doc, invertTransform(entry.transform)),
      history: { past: history.past.slice(0, -1), future: [entry, ...history.future] },
    },
  ];
};

/** The document one step forward, or nothing when there is nothing to redo. */
export const redo = <T extends CanvasElement>(
  doc: VectorDocument<T>,
  history: History<T>,
): readonly HistoryStep<T>[] => {
  const [entry, ...rest] = history.future;
  if (entry === undefined) return [];
  return [
    {
      doc: applyTransform(doc, entry.transform),
      history: { past: [...history.past, entry], future: rest },
    },
  ];
};
