import { expect, test } from 'vite-plus/test';
import { safeHref } from '../../src/lib/links/safe-href.ts';

test.each([
  '/books/1',
  './a',
  '../a',
  'books/1',
  '?q=1',
  '#notes',
  '',
  '//example.com/a',
  'https://example.com/a?b=c:d',
  'HTTP://example.com',
  'mailto:someone@example.com',
  'tel:+61400000000',
  'books/a:b',
])('keeps %j', (href) => {
  expect(safeHref(href)).toBe(href);
});

test.each([
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  '\tjavascript:alert(1)',
  ' \u0000javascript:alert(1)',
  'java\tscript:alert(1)',
  'java\nscript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
  'blob:https://example.com/id',
])('drops %j', (href) => {
  expect(safeHref(href)).toBeUndefined();
});

test('returns the value as the browser reads it, without the stripped characters', () => {
  expect(safeHref('  https://exa\tmple.com/a\n ')).toBe('https://example.com/a');
});

test('passes undefined through', () => {
  expect(safeHref(undefined)).toBeUndefined();
});
