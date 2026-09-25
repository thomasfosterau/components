import { describe, expect, it } from 'vite-plus/test';
import {
  OG_SUBTITLE_PARAM,
  OG_TITLE_MAX_LENGTH,
  OG_TITLE_PARAM,
  OG_VERSION_PARAM,
  ogImageUrl,
  type OgImageCard,
} from '../../src/lib/seo/og-image.ts';

const ID = '0b54f5a1-6f2d-4f4e-9a0f-2f63c1f6a111';
const ORIGIN = 'https://example.org';
const canonicalHref = (path: string): string => new URL(path, ORIGIN).href;

/** The built URL, failing the test on `undefined`. */
const urlOf = (card: OgImageCard): URL => {
  const href = ogImageUrl(card, { href: canonicalHref });
  if (href === undefined) return expect.fail('expected a share-card URL, got undefined');
  return new URL(href);
};

describe('ogImageUrl', () => {
  it('resolves the card path through href, so the URL is absolute on the given origin', () => {
    const url = urlOf({ id: ID, title: 'Hello World' });
    expect(url.origin).toBe(ORIGIN);
    expect(url.pathname).toMatch(/^\/og\/.+\.png$/);
  });

  it('is relative when no href is given', () => {
    expect(ogImageUrl({ id: 'a', title: 'T' })).toBe('/og/a.png?t=T');
  });

  it('mounts under basePath', () => {
    expect(ogImageUrl({ id: 'a', title: 'T' }, { basePath: '/cards/' })).toBe('/cards/a.png?t=T');
  });

  it('carries the title and description in the query', () => {
    const url = urlOf({ id: ID, title: 'My Post', description: 'A subtitle' });
    expect(url.searchParams.get(OG_TITLE_PARAM)).toBe('My Post');
    expect(url.searchParams.get(OG_SUBTITLE_PARAM)).toBe('A subtitle');
  });

  it('omits a blank or null description', () => {
    expect(
      urlOf({ id: ID, title: 'T', description: '  ' }).searchParams.has(OG_SUBTITLE_PARAM),
    ).toBe(false);
    expect(
      urlOf({ id: ID, title: 'T', description: null }).searchParams.has(OG_SUBTITLE_PARAM),
    ).toBe(false);
  });

  it('derives a readable slug from the id', () => {
    expect(urlOf({ id: 'Some Title!! 123', title: 'x' }).pathname).toBe('/og/some-title-123.png');
  });

  it('falls back to a stable slug for an empty or garbage id', () => {
    expect(urlOf({ id: '!!!', title: 'x' }).pathname).toBe('/og/page.png');
  });

  it('returns undefined for a blank title, so the default image wins', () => {
    expect(ogImageUrl({ id: ID, title: '' })).toBeUndefined();
    expect(ogImageUrl({ id: ID, title: '   ' })).toBeUndefined();
  });

  describe('cache-busting: a content change mints a new URL', () => {
    it('changes when the title changes', () => {
      expect(urlOf({ id: ID, title: 'First' }).href).not.toBe(
        urlOf({ id: ID, title: 'Second' }).href,
      );
    });

    it('changes when the description changes', () => {
      expect(urlOf({ id: ID, title: 'T', description: 'before' }).href).not.toBe(
        urlOf({ id: ID, title: 'T', description: 'after' }).href,
      );
    });

    it('changes when updatedAt advances', () => {
      const a = urlOf({ id: ID, title: 'T', updatedAt: new Date('2026-01-01') });
      const b = urlOf({ id: ID, title: 'T', updatedAt: new Date('2026-02-01') });
      expect(a.searchParams.get(OG_VERSION_PARAM)).not.toBe(b.searchParams.get(OG_VERSION_PARAM));
    });

    it('is stable for identical content', () => {
      const at = new Date('2026-01-01T00:00:00Z');
      expect(urlOf({ id: ID, title: 'T', description: 'd', updatedAt: at }).href).toBe(
        urlOf({ id: ID, title: 'T', description: 'd', updatedAt: at }).href,
      );
    });
  });

  it('accepts a Date, an epoch number and an ISO string equivalently', () => {
    const iso = '2026-03-04T05:06:07.000Z';
    const ms = new Date(iso).getTime();
    for (const updatedAt of [new Date(iso), ms, iso]) {
      expect(urlOf({ id: ID, title: 'T', updatedAt }).searchParams.get(OG_VERSION_PARAM)).toBe(
        String(ms),
      );
    }
  });

  it('omits the version token for a null or unparseable updatedAt', () => {
    expect(urlOf({ id: ID, title: 'T', updatedAt: null }).searchParams.has(OG_VERSION_PARAM)).toBe(
      false,
    );
    expect(
      urlOf({ id: ID, title: 'T', updatedAt: 'not a date' }).searchParams.has(OG_VERSION_PARAM),
    ).toBe(false);
  });

  it('caps an over-long title', () => {
    const url = urlOf({ id: ID, title: 'a'.repeat(OG_TITLE_MAX_LENGTH + 50) });
    expect(url.searchParams.get(OG_TITLE_PARAM)).toHaveLength(OG_TITLE_MAX_LENGTH);
  });
});
