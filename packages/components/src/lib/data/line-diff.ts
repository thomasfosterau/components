/**
 * The line diff `DiffView` renders: Myers' O(ND) diff over lines, word runs
 * within paired changed lines, and the collapsing of long unchanged runs.
 * Pure and dependency-free, so an app can diff on a server and render later.
 *
 * @module
 */

import type { DiffSegment } from './diff.ts';

/** One step of a sequence diff: indices into the old (`a`) and new (`b`) sequences. */
export type SequenceEdit =
  | { readonly kind: 'equal'; readonly a: number; readonly b: number }
  | { readonly kind: 'delete'; readonly a: number }
  | { readonly kind: 'insert'; readonly b: number };

/** One line of a line diff, in unified order: a change's removed lines come before its added ones. */
export interface DiffLine {
  readonly kind: 'equal' | 'insert' | 'delete';
  /** The line, without its line break. */
  readonly text: string;
  /** 1-based line number in `before`; `undefined` for an added line. */
  readonly beforeNumber: number | undefined;
  /** 1-based line number in `after`; `undefined` for a removed line. */
  readonly afterNumber: number | undefined;
  /**
   * Word-level runs, when this changed line is paired with one on the other
   * side and the two share a word. A removed line holds `equal` and `delete`
   * runs, an added line `equal` and `insert` runs.
   */
  readonly segments: readonly DiffSegment[] | undefined;
  /** The text this line ends has no final line break. */
  readonly noNewline: boolean;
}

/** A line diff and its counts. */
export interface LineDiff {
  readonly lines: readonly DiffLine[];
  readonly added: number;
  readonly removed: number;
}

/** A run of lines `DiffView` shows, or a run of unchanged lines it collapses. */
export interface DiffBlock {
  readonly kind: 'shown' | 'collapsed';
  readonly lines: readonly DiffLine[];
}

/** One row of a side-by-side diff; a side is `undefined` where it has no line. */
export interface SplitRow {
  readonly before: DiffLine | undefined;
  readonly after: DiffLine | undefined;
}

/**
 * Myers' shortest edit script between two sequences, compared with `===`.
 * Common leading and trailing runs are matched before the search, so a small
 * change in a long text costs little.
 */
export function diffSequences<T>(a: readonly T[], b: readonly T[]): SequenceEdit[] {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const middle = myers({ a, b, start, n: endA - start, m: endB - start });
  const edits: SequenceEdit[] = [];
  for (let index = 0; index < start; index++) edits.push({ kind: 'equal', a: index, b: index });
  edits.push(...middle);
  for (let index = 0; endA + index < a.length; index++) {
    edits.push({ kind: 'equal', a: endA + index, b: endB + index });
  }
  return edits;
}

/** Whether Myers' step onto diagonal `k` at depth `d` comes down from `k + 1` (an insertion). */
const takeInsert = (row: (k: number) => number, d: number, k: number): boolean =>
  k === -d || (k !== d && row(k - 1) < row(k + 1));

/** A slice of the old and new sequences that Myers searches. */
interface Window<T> {
  readonly a: readonly T[];
  readonly b: readonly T[];
  readonly start: number;
  readonly n: number;
  readonly m: number;
}

/** The furthest-reaching point on diagonal `k`, after following its run of matches. */
function slide<T>(window: Window<T>, x: number, k: number): number {
  let end = x;
  while (
    end < window.n &&
    end - k < window.m &&
    window.a[window.start + end] === window.b[window.start + end - k]
  ) {
    end++;
  }
  return end;
}

/**
 * Myers' forward search: each step's frontier, kept (only the diagonals it
 * can reach, so memory is O(D²)) for the walk back.
 */
function searchFrontiers<T>(window: Window<T>): Int32Array[] {
  const max = window.n + window.m;
  const offset = max + 1;
  const frontier = new Int32Array(2 * max + 3);
  const row = (k: number): number => frontier[offset + k] ?? 0;
  const trace: Int32Array[] = [];
  for (let d = 0; d <= max; d++) {
    trace.push(frontier.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      const x = slide(window, takeInsert(row, d, k) ? row(k + 1) : row(k - 1) + 1, k);
      frontier[offset + k] = x;
      if (x >= window.n && x - k >= window.m) return trace;
    }
  }
  return trace;
}

/** Myers over `a[start, start + n)` and `b[start, start + m)`: search, then walk the frontiers back. */
function myers<T>(window: Window<T>): SequenceEdit[] {
  const { start } = window;
  const trace = searchFrontiers(window);
  const reversed: SequenceEdit[] = [];
  let x = window.n;
  let y = window.m;
  for (let d = trace.length - 1; d > 0; d--) {
    const snapshot = trace[d] ?? new Int32Array(0);
    const row = (k: number): number => snapshot[k + d + 1] ?? 0;
    const k = x - y;
    const previousK = takeInsert(row, d, k) ? k + 1 : k - 1;
    const previousX = row(previousK);
    const previousY = previousX - previousK;
    for (; x > previousX && y > previousY; x--, y--) {
      reversed.push({ kind: 'equal', a: start + x - 1, b: start + y - 1 });
    }
    reversed.push(
      x === previousX
        ? { kind: 'insert', b: start + previousY }
        : { kind: 'delete', a: start + previousX },
    );
    x = previousX;
    y = previousY;
  }
  // Depth 0 is the run of matches from the origin.
  for (; x > 0; x--, y--) reversed.push({ kind: 'equal', a: start + x - 1, b: start + y - 1 });
  return reversed.toReversed();
}

interface SplitText {
  readonly lines: readonly string[];
  readonly noNewline: boolean;
}

/** Splits on LF after normalising CRLF and CR; a final line break ends the last line rather than starting an empty one. */
function splitLines(text: string): SplitText {
  if (text === '') return { lines: [], noNewline: false };
  const normalised = text.replace(/\r\n?/g, '\n');
  const endsWithBreak = normalised.endsWith('\n');
  const lines = (endsWithBreak ? normalised.slice(0, -1) : normalised).split('\n');
  return { lines, noNewline: !endsWithBreak };
}

/** A line's comparison key: a last line without a line break differs from the same text with one. */
function lineKeys({ lines, noNewline }: SplitText): string[] {
  return lines.map((line, index) =>
    noNewline && index === lines.length - 1 ? `${line}\u0000` : line,
  );
}

const WORD = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;

function pushRun(runs: DiffSegment[], kind: DiffSegment['kind'], text: string): void {
  const last = runs.at(-1);
  if (last?.kind === kind) runs[runs.length - 1] = { kind, text: last.text + text };
  else runs.push({ kind, text });
}

/**
 * Word runs for a removed line and the added line paired with it, or
 * `undefined` when they share no word (the whole line changed, so
 * highlighting every word would say nothing).
 */
export function diffWords(
  before: string,
  after: string,
): { readonly before: DiffSegment[]; readonly after: DiffSegment[] } | undefined {
  const a = before.match(WORD) ?? [];
  const b = after.match(WORD) ?? [];
  const beforeRuns: DiffSegment[] = [];
  const afterRuns: DiffSegment[] = [];
  let shared = false;
  for (const edit of diffSequences(a, b)) {
    if (edit.kind === 'equal') {
      const token = a[edit.a] ?? '';
      if (token.trim() !== '') shared = true;
      pushRun(beforeRuns, 'equal', token);
      pushRun(afterRuns, 'equal', token);
    } else if (edit.kind === 'delete') {
      pushRun(beforeRuns, 'delete', a[edit.a] ?? '');
    } else {
      pushRun(afterRuns, 'insert', b[edit.b] ?? '');
    }
  }
  return shared ? { before: beforeRuns, after: afterRuns } : undefined;
}

/**
 * Diffs two texts line by line. Line endings are normalised, so CRLF against
 * LF is no change; a missing final line break is one. With `wordDiff`, the
 * nth removed line of a change is paired with its nth added line for word runs.
 */
export function diffLines(
  before: string,
  after: string,
  options: { readonly wordDiff?: boolean | undefined } = {},
): LineDiff {
  const old = splitLines(before);
  const next = splitLines(after);
  const edits = diffSequences(lineKeys(old), lineKeys(next));
  const lines: DiffLine[] = [];
  let added = 0;
  let removed = 0;
  let deletes: DiffLine[] = [];
  let inserts: DiffLine[] = [];

  const flush = (): void => {
    if (options.wordDiff ?? true) {
      for (let index = 0; index < Math.min(deletes.length, inserts.length); index++) {
        const [removedLine, addedLine] = [deletes[index], inserts[index]];
        if (removedLine === undefined || addedLine === undefined) continue;
        const words = diffWords(removedLine.text, addedLine.text);
        if (words === undefined) continue;
        deletes[index] = { ...removedLine, segments: words.before };
        inserts[index] = { ...addedLine, segments: words.after };
      }
    }
    lines.push(...deletes, ...inserts);
    deletes = [];
    inserts = [];
  };

  for (const edit of edits) {
    if (edit.kind === 'delete') {
      removed++;
      deletes.push({
        kind: 'delete',
        text: old.lines[edit.a] ?? '',
        beforeNumber: edit.a + 1,
        afterNumber: undefined,
        segments: undefined,
        noNewline: old.noNewline && edit.a === old.lines.length - 1,
      });
    } else if (edit.kind === 'insert') {
      added++;
      inserts.push({
        kind: 'insert',
        text: next.lines[edit.b] ?? '',
        beforeNumber: undefined,
        afterNumber: edit.b + 1,
        segments: undefined,
        noNewline: next.noNewline && edit.b === next.lines.length - 1,
      });
    } else {
      flush();
      lines.push({
        kind: 'equal',
        text: old.lines[edit.a] ?? '',
        beforeNumber: edit.a + 1,
        afterNumber: edit.b + 1,
        segments: undefined,
        noNewline: false,
      });
    }
  }
  flush();
  return { lines, added, removed };
}

/**
 * Groups lines into what is shown — every change and `context` unchanged lines
 * either side of it — and the unchanged runs between, collapsed. A run that
 * would hide a single line is shown instead: a button costs as much space.
 */
export function diffBlocks(lines: readonly DiffLine[], context: number): DiffBlock[] {
  const keep = Math.max(0, Math.floor(context));
  const shown = lines.map(() => false);
  lines.forEach((line, index) => {
    if (line.kind === 'equal') return;
    for (let near = index - keep; near <= index + keep; near++) {
      if (near >= 0 && near < lines.length) shown[near] = true;
    }
  });

  const blocks: DiffBlock[] = [];
  let run: DiffLine[] = [];
  let runShown = true;
  const close = (): void => {
    if (run.length === 0) return;
    const kind = runShown || run.length < 2 ? 'shown' : 'collapsed';
    const previous = blocks.at(-1);
    if (kind === 'shown' && previous?.kind === 'shown') {
      blocks[blocks.length - 1] = { kind, lines: [...previous.lines, ...run] };
    } else {
      blocks.push({ kind, lines: run });
    }
    run = [];
  };
  lines.forEach((line, index) => {
    const isShown = shown[index] ?? true;
    if (isShown !== runShown) {
      close();
      runShown = isShown;
    }
    run.push(line);
  });
  close();
  return blocks;
}

/**
 * Pairs unified lines into side-by-side rows: an unchanged line fills both
 * sides, and a change's nth removed line sits beside its nth added line.
 */
export function splitRows(lines: readonly DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let deletes: DiffLine[] = [];
  let inserts: DiffLine[] = [];
  const flush = (): void => {
    for (let index = 0; index < Math.max(deletes.length, inserts.length); index++) {
      rows.push({ before: deletes[index], after: inserts[index] });
    }
    deletes = [];
    inserts = [];
  };
  for (const line of lines) {
    if (line.kind === 'delete') {
      // A removed line after added ones starts a new change.
      if (inserts.length > 0) flush();
      deletes.push(line);
    } else if (line.kind === 'insert') {
      inserts.push(line);
    } else {
      flush();
      rows.push({ before: line, after: line });
    }
  }
  flush();
  return rows;
}
