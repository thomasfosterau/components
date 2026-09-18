import { expect, test, describe } from 'vitest';
import { createTipStack } from '../../src/lib/tips/tip-stack.ts';

describe('createTipStack', () => {
  test('names the most recently pushed tip as the topmost', () => {
    const stack = createTipStack();
    stack.push('a');
    stack.push('b');
    expect(stack.isTopmost('b')).toBe(true);
    expect(stack.isTopmost('a')).toBe(false);
  });

  test('moves a re-pushed tip to the top rather than duplicating it', () => {
    const stack = createTipStack();
    stack.push('a');
    stack.push('b');
    stack.push('a');
    expect(stack.isTopmost('a')).toBe(true);
    stack.pop('a');
    expect(stack.isTopmost('b')).toBe(true);
  });

  test('has no topmost when nothing is showing', () => {
    const stack = createTipStack();
    expect(stack.isTopmost('a')).toBe(false);
  });
});
