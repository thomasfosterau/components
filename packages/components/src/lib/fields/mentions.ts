/**
 * The text model behind `MentionInput`. The field shows plain display text
 * ("Hi @Thomas Foster"); the mentions are ranges over it, and the stored
 * value writes each as markup with a stable id: `@[Thomas Foster](user:42)`.
 *
 * @module
 */

/** A mention in display text: `text.slice(start, end)` is `char + label`. */
export interface MentionToken {
  readonly char: string;
  readonly id: string;
  readonly label: string;
  readonly start: number;
  readonly end: number;
}

/** The same mention moved by `delta` characters. */
const shiftMention = (mention: MentionToken, delta: number): MentionToken => ({
  char: mention.char,
  id: mention.id,
  label: mention.label,
  start: mention.start + delta,
  end: mention.end + delta,
});

/** Display text and the mentions in it. */
export interface ParsedMentions {
  readonly text: string;
  readonly mentions: readonly MentionToken[];
}

/** The trigger characters `parseMentions` reads when none are given. */
export const defaultMentionChars: readonly string[] = ['@', '#', ':'];

/** Read `\x` escapes up to `close`; `undefined` if `close` never comes. */
const readUntil = (
  value: string,
  from: number,
  close: string,
): { text: string; next: number } | undefined => {
  let text = '';
  for (let i = from; i < value.length; i += 1) {
    const ch = value.charAt(i);
    if (ch === '\\' && i + 1 < value.length) {
      text += value.charAt(i + 1);
      i += 1;
    } else if (ch === close) {
      return { text, next: i + 1 };
    } else {
      text += ch;
    }
  }
  return undefined;
};

/** A mention's markup starting at `at`, or `undefined` if there is none. */
const readMention = (
  value: string,
  at: number,
): { label: string; id: string; next: number } | undefined => {
  if (value.charAt(at + 1) !== '[') return undefined;
  const label = readUntil(value, at + 2, ']');
  if (!label || value.charAt(label.next) !== '(') return undefined;
  const id = readUntil(value, label.next + 1, ')');
  return id ? { label: label.text, id: id.text, next: id.next } : undefined;
};

/** A plain-text escape after a trigger: `\[` and `\\` stand for `[` and `\`. */
const readEscape = (value: string, at: number): string | undefined => {
  const next = value.charAt(at + 1);
  return value.charAt(at) === '\\' && (next === '[' || next === '\\') ? next : undefined;
};

/** Split a stored value into display text and mentions. */
export function parseMentions(
  value: string,
  chars: readonly string[] = defaultMentionChars,
): ParsedMentions {
  let text = '';
  const mentions: MentionToken[] = [];
  let i = 0;
  while (i < value.length) {
    const ch = value.charAt(i);
    const mention = chars.includes(ch) ? readMention(value, i) : undefined;
    const escaped = chars.includes(ch) ? readEscape(value, i + 1) : undefined;
    if (mention) {
      const start = text.length;
      text += ch + mention.label;
      mentions.push({ char: ch, id: mention.id, label: mention.label, start, end: text.length });
      i = mention.next;
    } else if (escaped) {
      text += ch + escaped;
      i += 3;
    } else {
      text += ch;
      i += 1;
    }
  }
  return { text, mentions };
}

const escapeIn = (part: string, specials: RegExp): string =>
  part.replaceAll(specials, (m) => `\\${m}`);

/** Escape plain text so no trigger in it reads back as markup. */
const escapePlain = (plain: string, chars: readonly string[]): string => {
  let out = '';
  for (let i = 0; i < plain.length; i += 1) {
    const ch = plain.charAt(i);
    const next = plain.charAt(i + 1);
    out += ch;
    if (chars.includes(ch) && (next === '[' || next === '\\')) out += '\\';
  }
  return out;
};

/** Write display text and its mentions back as a stored value. */
export function serializeMentions(
  text: string,
  mentions: readonly MentionToken[],
  chars: readonly string[] = defaultMentionChars,
): string {
  let out = '';
  let at = 0;
  for (const mention of mentions.toSorted((a, b) => a.start - b.start)) {
    out += escapePlain(text.slice(at, mention.start), chars);
    out += `${mention.char}[${escapeIn(mention.label, /[\\\]]/g)}](${escapeIn(mention.id, /[\\)]/g)})`;
    at = mention.end;
  }
  return out + escapePlain(text.slice(at), chars);
}

/**
 * Carry the mentions across an edit from `before` to `after`: those after the
 * edit shift, and any the edit touched become plain text.
 */
export function applyEdit(
  before: string,
  after: string,
  mentions: readonly MentionToken[],
): MentionToken[] {
  const most = Math.min(before.length, after.length);
  let prefix = 0;
  while (prefix < most && before.charAt(prefix) === after.charAt(prefix)) prefix += 1;
  let suffix = 0;
  while (
    suffix < most - prefix &&
    before.charAt(before.length - 1 - suffix) === after.charAt(after.length - 1 - suffix)
  ) {
    suffix += 1;
  }
  const editEnd = before.length - suffix;
  const delta = after.length - before.length;
  return mentions.flatMap((mention) => {
    if (mention.end <= prefix) return [mention];
    if (mention.start >= editEnd) {
      return [shiftMention(mention, delta)];
    }
    return [];
  });
}

/** The trigger being typed at the caret. */
export interface MentionQuery {
  readonly char: string;
  /** Where the trigger character is. */
  readonly start: number;
  /** The text typed after it. */
  readonly query: string;
}

const BOUNDARY = /[\s([{"'“‘]/u;

/**
 * The trigger the caret is in, if any: a trigger character at the start or
 * after a space or opening bracket, then no space up to the caret, and not
 * inside an existing mention.
 */
export function activeQuery(
  text: string,
  caret: number,
  chars: readonly string[],
  mentions: readonly MentionToken[],
): MentionQuery | undefined {
  for (let i = caret - 1; i >= 0; i -= 1) {
    const ch = text.charAt(i);
    if (/\s/u.test(ch)) return undefined;
    if (chars.includes(ch) && (i === 0 || BOUNDARY.test(text.charAt(i - 1)))) {
      const inside = mentions.some((mention) => i >= mention.start && i < mention.end);
      return inside ? undefined : { char: ch, start: i, query: text.slice(i + 1, caret) };
    }
  }
  return undefined;
}

/** The result of an insertion or removal: the new text, mentions and caret. */
export interface MentionEdit {
  readonly text: string;
  readonly mentions: MentionToken[];
  readonly caret: number;
}

/** Replace the query from `start` to `caret` with a mention and a space. */
export function insertMention(
  text: string,
  mentions: readonly MentionToken[],
  start: number,
  caret: number,
  token: { readonly char: string; readonly id: string; readonly label: string },
): MentionEdit {
  const shown = token.char + token.label;
  const next = `${text.slice(0, start)}${shown} ${text.slice(caret)}`;
  const kept = applyEdit(text, `${text.slice(0, start)}${text.slice(caret)}`, mentions);
  const shifted = kept.map((mention) =>
    mention.start >= start ? shiftMention(mention, shown.length + 1) : mention,
  );
  const mention: MentionToken = { ...token, start, end: start + shown.length };
  return {
    text: next,
    mentions: [...shifted, mention].toSorted((a, b) => a.start - b.start),
    caret: start + shown.length + 1,
  };
}

/** If a mention ends right at the caret, remove all of it (one Backspace). */
export function removeMentionBefore(
  text: string,
  mentions: readonly MentionToken[],
  caret: number,
): MentionEdit | undefined {
  const target = mentions.find((mention) => mention.end === caret);
  if (!target) return undefined;
  const length = target.end - target.start;
  return {
    text: text.slice(0, target.start) + text.slice(target.end),
    mentions: mentions
      .filter((mention) => mention !== target)
      .map((mention) => (mention.start >= target.end ? shiftMention(mention, -length) : mention)),
    caret: target.start,
  };
}

/** One suggestion offered for a trigger. */
export interface MentionOption {
  /** Stable id, written into the stored value. */
  readonly id: string;
  /** Shown in the list and, after the trigger character, in the text. */
  readonly label: string;
  /** A secondary line in the list. */
  readonly description?: string | undefined;
}

/** A trigger character and where its suggestions come from. */
export interface MentionTrigger {
  /** The character that starts a mention: `@`, `#`, `:`. */
  readonly char: string;
  /** Suggestions for the text typed after the trigger; the signal aborts when the query changes. */
  readonly search: (
    query: string,
    signal: AbortSignal,
  ) => Promise<readonly MentionOption[]> | readonly MentionOption[];
  /**
   * Characters needed after the trigger before suggesting.
   * @defaultValue `0`
   */
  readonly minChars?: number | undefined;
  /** Insert this plain text instead of a mention (an emoji for a `:` shortcode, say). */
  readonly replace?: ((option: MentionOption) => string) | undefined;
}
