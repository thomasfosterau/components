import { describe, expect, test } from 'vite-plus/test';
import {
  caretAfter,
  cardBrand,
  deleteAcrossLiteral,
  format,
  luhnValid,
  maskPresets,
  rawBefore,
  slotKind,
  toRaw,
} from '../../src/lib/fields/mask.ts';

const mobile = '9999 999 999';

describe('format', () => {
  test('a literal appears only once a character follows it', () => {
    expect(format('0412', mobile)).toBe('0412');
    expect(format('04123', mobile)).toBe('0412 3');
    expect(format('0412345678', mobile)).toBe('0412 345 678');
    expect(format('', '(99) 9999')).toBe('');
    expect(format('0', '(99) 9999')).toBe('(0');
  });
});

describe('toRaw', () => {
  test('keeps what each slot accepts, dropping literals, junk and overflow', () => {
    expect(toRaw('0412-345 678', mobile)).toBe('0412345678');
    expect(toRaw('04x12', mobile)).toBe('0412');
    expect(toRaw('04123456789999', mobile)).toBe('0412345678');
    expect(toRaw('ab12', 'a9a9')).toBe('a1');
  });

  test('a preset can normalise before filling the pattern', () => {
    const { mask, normalise } = maskPresets.auMobile;
    expect(toRaw('+61 412-345-678', mask, normalise)).toBe('0412345678');
  });
});

describe('caret mapping', () => {
  test('counts raw characters before the caret and maps them back', () => {
    expect(rawBefore('0412 3', 6, mobile)).toBe(5);
    expect(caretAfter('0412 345 678', 5, mobile)).toBe(6);
    expect(caretAfter('0412 345 678', 4, mobile)).toBe(4);
    expect(caretAfter('0412', 0, mobile)).toBe(0);
  });
});

describe('deleteAcrossLiteral', () => {
  test('Backspace just after a separator removes the digit before it', () => {
    expect(deleteAcrossLiteral('0412 345', 5, 'backward', mobile)).toEqual({
      raw: '041345',
      caret: 3,
    });
  });

  test('Delete just before a separator removes the digit after it', () => {
    expect(deleteAcrossLiteral('0412 345', 4, 'forward', mobile)).toEqual({
      raw: '041245',
      caret: 4,
    });
  });

  test('leaves deletion of a raw character to the browser', () => {
    expect(deleteAcrossLiteral('0412 345', 3, 'backward', mobile)).toBeUndefined();
    expect(deleteAcrossLiteral('0412', 4, 'forward', mobile)).toBeUndefined();
  });
});

describe('cards', () => {
  test('the brand picks the grouping', () => {
    expect(cardBrand('378282246310005')).toBe('amex');
    expect(format('378282246310005', maskPresets.card.mask)).toBe('3782 822463 10005');
    expect(format('4111111111111111', maskPresets.card.mask)).toBe('4111 1111 1111 1111');
    expect(cardBrand('5555')).toBe('mastercard');
    expect(cardBrand('6011')).toBe('other');
  });

  test('Luhn', () => {
    expect(luhnValid('4111111111111111')).toBe(true);
    expect(luhnValid('4111111111111112')).toBe(false);
    expect(luhnValid('4111')).toBe(false);
  });
});

test('slotKind', () => {
  expect(slotKind(mobile)).toBe('digits');
  expect(slotKind('aaa')).toBe('letters');
  expect(slotKind('a9')).toBe('mixed');
});
