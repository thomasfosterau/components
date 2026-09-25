import { describe, expect, it } from 'vite-plus/test';
import { serializeJsonLd } from '../../src/lib/seo/json-ld.ts';

describe('serializeJsonLd', () => {
  it('escapes < so </script> cannot close the embedding script block', () => {
    const out = serializeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '</script><script>alert(1)</script>',
    });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003C');
  });

  it('escapes > and &', () => {
    const out = serializeJsonLd({ '@context': 'https://schema.org', headline: 'A > B & C' });
    expect(out).not.toMatch(/[>&]/);
    expect(out).toContain('\\u003E');
    expect(out).toContain('\\u0026');
  });

  it('escapes the U+2028 / U+2029 line terminators', () => {
    const out = serializeJsonLd({
      '@context': 'https://schema.org',
      headline: `a${String.fromCharCode(0x2028)}b${String.fromCharCode(0x2029)}c`,
    });
    expect(out).toContain('\\u2028');
    expect(out).toContain('\\u2029');
  });

  it('produces valid JSON that round-trips to the input', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: "A <b>bold</b> title & 'quotes'",
    };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it('leaves forward slashes alone', () => {
    const out = serializeJsonLd({
      '@context': 'https://schema.org',
      url: 'https://example.org/posts/abc',
    });
    expect(out).toContain('https://example.org/posts/abc');
  });
});
