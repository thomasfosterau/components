/**
 * The APG Grid key arithmetic an editing `DataGrid` is built on, tested
 * without the component.
 */

import { expect, test } from 'vite-plus/test';
import {
  clampPoint,
  gridEditKey,
  gridEditStart,
  gridMove,
  isPrintableKey,
  pointAfterCommit,
  type GridKeyEvent,
} from '../../src/lib/data/grid-keys.ts';

const key = (name: string, modifiers: Partial<GridKeyEvent> = {}): GridKeyEvent => ({
  key: name,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...modifiers,
});

// A header row and four body rows, three columns; Page Up / Down move two.
const bounds = { rows: 5, cols: 3, page: 2 };

test('arrows move one cell and stop at the edges', () => {
  expect(gridMove(key('ArrowRight'), { row: 1, col: 0 }, bounds)).toEqual({ row: 1, col: 1 });
  expect(gridMove(key('ArrowDown'), { row: 1, col: 0 }, bounds)).toEqual({ row: 2, col: 0 });
  expect(gridMove(key('ArrowLeft'), { row: 1, col: 0 }, bounds)).toEqual({ row: 1, col: 0 });
  expect(gridMove(key('ArrowUp'), { row: 0, col: 2 }, bounds)).toEqual({ row: 0, col: 2 });
  expect(gridMove(key('ArrowDown'), { row: 4, col: 2 }, bounds)).toEqual({ row: 4, col: 2 });
});

test('Home and End go to the row’s ends; with Ctrl or ⌘, to the grid’s', () => {
  expect(gridMove(key('Home'), { row: 3, col: 2 }, bounds)).toEqual({ row: 3, col: 0 });
  expect(gridMove(key('End'), { row: 3, col: 0 }, bounds)).toEqual({ row: 3, col: 2 });
  expect(gridMove(key('Home', { ctrlKey: true }), { row: 3, col: 2 }, bounds)).toEqual({
    row: 0,
    col: 0,
  });
  expect(gridMove(key('End', { metaKey: true }), { row: 1, col: 0 }, bounds)).toEqual({
    row: 4,
    col: 2,
  });
});

test('Page Up and Page Down move by the page step, clamped', () => {
  expect(gridMove(key('PageDown'), { row: 1, col: 1 }, bounds)).toEqual({ row: 3, col: 1 });
  expect(gridMove(key('PageDown'), { row: 3, col: 1 }, bounds)).toEqual({ row: 4, col: 1 });
  expect(gridMove(key('PageUp'), { row: 1, col: 1 }, bounds)).toEqual({ row: 0, col: 1 });
});

test('other keys, and Alt or Ctrl+arrow chords, are not moves', () => {
  expect(gridMove(key('a'), { row: 1, col: 1 }, bounds)).toBeUndefined();
  expect(gridMove(key('ArrowDown', { altKey: true }), { row: 1, col: 1 }, bounds)).toBeUndefined();
  expect(gridMove(key('ArrowDown', { ctrlKey: true }), { row: 1, col: 1 }, bounds)).toBeUndefined();
});

test('clampPoint pulls a point back inside a grid that shrank', () => {
  expect(clampPoint({ row: 9, col: 9 }, bounds)).toEqual({ row: 4, col: 2 });
  expect(clampPoint({ row: 3, col: 1 }, { rows: 1, cols: 3, page: 2 })).toEqual({ row: 0, col: 1 });
});

test('Enter and F2 edit, a printable character types over, Alt+Down opens', () => {
  expect(gridEditStart(key('Enter'))).toBe('edit');
  expect(gridEditStart(key('F2'))).toBe('edit');
  expect(gridEditStart(key('7'))).toBe('type');
  expect(gridEditStart(key('ArrowDown', { altKey: true }))).toBe('open');
  expect(gridEditStart(key(' '))).toBeUndefined();
  expect(gridEditStart(key('c', { ctrlKey: true }))).toBeUndefined();
  expect(isPrintableKey(key('é'))).toBe(true);
  expect(isPrintableKey(key('Shift'))).toBe(false);
});

test('edit-mode keys: Enter, Tab and Shift+Tab commit, Escape cancels', () => {
  expect(gridEditKey(key('Enter'))).toBe('commit-down');
  expect(gridEditKey(key('Enter', { shiftKey: true }))).toBeUndefined();
  expect(gridEditKey(key('Tab'))).toBe('commit-next');
  expect(gridEditKey(key('Tab', { shiftKey: true }))).toBe('commit-previous');
  expect(gridEditKey(key('Escape'))).toBe('cancel');
  expect(gridEditKey(key('a'))).toBeUndefined();
});

test('after a commit: down a row, or on in reading order between body rows', () => {
  expect(pointAfterCommit('commit-down', { row: 2, col: 1 }, bounds)).toEqual({ row: 3, col: 1 });
  expect(pointAfterCommit('commit-down', { row: 4, col: 1 }, bounds)).toEqual({ row: 4, col: 1 });
  expect(pointAfterCommit('commit-next', { row: 2, col: 1 }, bounds)).toEqual({ row: 2, col: 2 });
  expect(pointAfterCommit('commit-next', { row: 2, col: 2 }, bounds)).toEqual({ row: 3, col: 0 });
  expect(pointAfterCommit('commit-next', { row: 4, col: 2 }, bounds)).toEqual({ row: 4, col: 2 });
  expect(pointAfterCommit('commit-previous', { row: 3, col: 0 }, bounds)).toEqual({
    row: 2,
    col: 2,
  });
  // Never back into the header row.
  expect(pointAfterCommit('commit-previous', { row: 1, col: 0 }, bounds)).toEqual({
    row: 1,
    col: 0,
  });
  expect(pointAfterCommit('cancel', { row: 1, col: 1 }, bounds)).toEqual({ row: 1, col: 1 });
});
