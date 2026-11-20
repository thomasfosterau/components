import { describe, expect, test } from 'vite-plus/test';
import {
  activeQuery,
  applyEdit,
  insertMention,
  parseMentions,
  removeMentionBefore,
  serializeMentions,
} from '../../src/lib/fields/mentions.ts';

describe('parse and serialise', () => {
  test('round-trip, adjacent tokens included', () => {
    const value = 'Hi @[Thomas Foster](user:42)@[Tilly](user:7), sow #[tomato](plant:1)';
    const parsed = parseMentions(value);
    expect(parsed.text).toBe('Hi @Thomas Foster@Tilly, sow #tomato');
    expect(parsed.mentions.map((m) => [m.char, m.id, m.start, m.end])).toEqual([
      ['@', 'user:42', 3, 17],
      ['@', 'user:7', 17, 23],
      ['#', 'plant:1', 29, 36],
    ]);
    expect(serializeMentions(parsed.text, parsed.mentions)).toBe(value);
  });

  test('brackets in labels and ids are escaped', () => {
    const value = serializeMentions('@A]b', [
      { char: '@', id: 'x)y', label: 'A]b', start: 0, end: 4 },
    ]);
    expect(value).toBe('@[A\\]b](x\\)y)');
    expect(parseMentions(value).mentions[0]).toMatchObject({ label: 'A]b', id: 'x)y' });
  });

  test('plain text that looks like markup stays plain', () => {
    for (const plain of ['email@[host](x)', '@\\[', 'a @[b] c', '#\\\\[x](y)']) {
      const stored = serializeMentions(plain, []);
      const parsed = parseMentions(stored);
      expect(parsed.text).toBe(plain);
      expect(parsed.mentions).toEqual([]);
    }
  });

  test('unclosed markup is plain text', () => {
    expect(parseMentions('@[Thomas (user').text).toBe('@[Thomas (user');
  });
});

describe('editing', () => {
  const base = parseMentions('a @[B](1) c');

  test('typing before a mention shifts it', () => {
    expect(applyEdit(base.text, 'xa @B c', base.mentions)[0]).toMatchObject({ start: 3, end: 5 });
  });

  test('typing inside a mention drops it', () => {
    expect(applyEdit(base.text, 'a @Bx c'.replace('Bx', 'xB'), base.mentions)).toEqual([]);
  });

  test('typing right after a mention keeps it', () => {
    expect(applyEdit(base.text, 'a @Bx c', base.mentions)).toHaveLength(1);
  });

  test('inserting and removing a mention', () => {
    const inserted = insertMention('Hi @th later', [], 3, 6, {
      char: '@',
      id: 'user:42',
      label: 'Thomas',
    });
    expect(inserted.text).toBe('Hi @Thomas  later');
    expect(inserted.caret).toBe(11);
    const removed = removeMentionBefore(inserted.text, inserted.mentions, 10);
    expect(removed?.text).toBe('Hi   later');
    expect(removeMentionBefore(inserted.text, inserted.mentions, 11)).toBeUndefined();
  });
});

describe('activeQuery', () => {
  test('finds a trigger at a word start', () => {
    expect(activeQuery('Hi @tho', 7, ['@'], [])).toEqual({ char: '@', start: 3, query: 'tho' });
    expect(activeQuery('(@t', 3, ['@'], [])).toMatchObject({ start: 1 });
  });

  test('ignores mid-word triggers, spaces and existing mentions', () => {
    expect(activeQuery('me@host', 7, ['@'], [])).toBeUndefined();
    expect(activeQuery('@a b', 4, ['@'], [])).toBeUndefined();
    const parsed = parseMentions('@[Tom](1)');
    expect(activeQuery(parsed.text, 4, ['@'], parsed.mentions)).toBeUndefined();
  });
});
