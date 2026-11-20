/**
 * The line diff under `DiffView`: Myers' minimal edit script, line-ending
 * normalisation, word runs within paired lines, and collapsing.
 */

import { describe, expect, test } from 'vite-plus/test';
import {
  diffBlocks,
  diffLines,
  diffSequences,
  diffWords,
  splitRows,
} from '../../src/lib/data/line-diff.ts';

/** Replays an edit script, checking it rebuilds `b` from `a`. */
function apply<T>(a: readonly T[], b: readonly T[]): T[] {
  return diffSequences(a, b).flatMap((edit) =>
    edit.kind === 'delete' ? [] : [edit.kind === 'equal' ? a[edit.a]! : b[edit.b]!],
  );
}

const edits = (a: string, b: string): number =>
  diffSequences(a.split(''), b.split('')).filter((edit) => edit.kind !== 'equal').length;

describe('diffSequences', () => {
  test.each([
    ['', ''],
    ['abc', ''],
    ['', 'abc'],
    ['abc', 'abc'],
    ['abcabba', 'cbabac'],
    ['kitten', 'sitting'],
    ['the quick brown fox', 'the slow brown dog'],
  ])('rebuilds %j into %j', (a, b) => {
    expect(apply(a.split(''), b.split('')).join('')).toBe(b);
  });

  test('finds the shortest edit script', () => {
    // Myers' paper's example: D = 5.
    expect(edits('abcabba', 'cbabac')).toBe(5);
    expect(edits('kitten', 'sitting')).toBe(5);
    expect(edits('same', 'same')).toBe(0);
  });

  test('keeps equal indices aligned around a change in the middle', () => {
    expect(diffSequences(['a', 'b', 'c'], ['a', 'x', 'c'])).toEqual([
      { kind: 'equal', a: 0, b: 0 },
      { kind: 'delete', a: 1 },
      { kind: 'insert', b: 1 },
      { kind: 'equal', a: 2, b: 2 },
    ]);
  });
});

describe('diffLines', () => {
  test('numbers lines on each side and counts the changes', () => {
    const diff = diffLines('one\ntwo\nthree\n', 'one\n2\nthree\nfour\n');
    expect(diff.added).toBe(2);
    expect(diff.removed).toBe(1);
    expect(diff.lines.map((line) => [line.kind, line.beforeNumber, line.afterNumber])).toEqual([
      ['equal', 1, 1],
      ['delete', 2, undefined],
      ['insert', undefined, 2],
      ['equal', 3, 3],
      ['insert', undefined, 4],
    ]);
  });

  test('treats CRLF and LF as the same line ending', () => {
    const diff = diffLines('a\r\nb\r\n', 'a\nb\n');
    expect(diff.added + diff.removed).toBe(0);
  });

  test('sees a missing final line break as a change to the last line', () => {
    const diff = diffLines('a\nb\n', 'a\nb');
    expect(diff.lines.map((line) => [line.kind, line.text, line.noNewline])).toEqual([
      ['equal', 'a', false],
      ['delete', 'b', false],
      ['insert', 'b', true],
    ]);
  });

  test('pairs changed lines into word runs when they share a word', () => {
    const diff = diffLines('Sow basil in spring', 'Sow basil in late spring');
    expect(diff.lines.find((line) => line.kind === 'insert')?.segments).toEqual([
      { kind: 'equal', text: 'Sow basil in ' },
      { kind: 'insert', text: 'late ' },
      { kind: 'equal', text: 'spring' },
    ]);
    expect(diffLines('a b', 'a c', { wordDiff: false }).lines[0]?.segments).toBeUndefined();
  });
});

test('diffWords leaves lines that share no word unhighlighted', () => {
  expect(diffWords('alpha beta', 'gamma delta')).toBeUndefined();
});

describe('diffBlocks', () => {
  const twelve = Array.from({ length: 12 }, (_, index) => `line ${index + 1}`);

  test('collapses unchanged runs beyond the context', () => {
    const after = [...twelve];
    after[0] = 'first';
    after[11] = 'last';
    const blocks = diffBlocks(diffLines(twelve.join('\n'), after.join('\n')).lines, 1);
    expect(blocks.map((block) => [block.kind, block.lines.length])).toEqual([
      ['shown', 3],
      ['collapsed', 8],
      ['shown', 3],
    ]);
  });

  test('shows a run that would hide only one line', () => {
    const before = ['line 1', 'line 2', 'line 3'].join('\n');
    const blocks = diffBlocks(diffLines(before, 'first\nline 2\nthird').lines, 0);
    expect(blocks.map((block) => block.kind)).toEqual(['shown']);
  });
});

test('splitRows puts the nth removed line beside the nth added one', () => {
  const rows = splitRows(diffLines('a\nb\nc\n', 'a\nB\nC\nD\n').lines);
  expect(rows.map((row) => [row.before?.text, row.after?.text])).toEqual([
    ['a', 'a'],
    ['b', 'B'],
    ['c', 'C'],
    [undefined, 'D'],
  ]);
});
