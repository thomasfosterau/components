import { expect, test } from 'vite-plus/test';
import { embedSource } from '../../src/lib/media/embed-providers.ts';

test('YouTube uses the privacy-enhanced host, autoplays only when asked, and links to the watch page', () => {
  const quiet = embedSource('youtube', 'dQw4w9WgXcQ', { start: 42.7 });
  expect(quiet?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=42');
  expect(quiet?.pageHref).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s');
  expect(quiet?.poster).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');

  expect(embedSource('youtube', 'dQw4w9WgXcQ', { autoplay: true })?.src).toContain('autoplay=1');
  expect(embedSource('youtube', 'not an id')).toBeUndefined();
});

test('Vimeo sets dnt=1 and takes only numeric ids', () => {
  expect(embedSource('vimeo', '76979871', { start: 10 })?.src).toBe(
    'https://player.vimeo.com/video/76979871?dnt=1#t=10s',
  );
  expect(embedSource('vimeo', '7697abc')).toBeUndefined();
});

test('Google Maps takes only a maps embed URL on www.google.com', () => {
  const map = 'https://www.google.com/maps/embed?pb=!1m18!1m12';
  expect(embedSource('google-maps', map)?.src).toBe(map);
  expect(embedSource('google-maps', 'https://evil.example/maps/embed?pb=1')).toBeUndefined();
  expect(embedSource('google-maps', 'https://www.google.com/search?q=x')).toBeUndefined();
});

test('generic needs an https URL on an allowed origin', () => {
  const allowedOrigins = ['https://open.spotify.com'];
  expect(
    embedSource('generic', 'https://open.spotify.com/embed/track/1', { allowedOrigins })?.name,
  ).toBe('open.spotify.com');
  expect(embedSource('generic', 'https://open.spotify.com/embed/track/1')).toBeUndefined();
  expect(embedSource('generic', 'https://other.example/x', { allowedOrigins })).toBeUndefined();
  expect(embedSource('generic', 'javascript:alert(1)', { allowedOrigins })).toBeUndefined();
  expect(embedSource('generic', 'data:text/html,<p>hi', { allowedOrigins })).toBeUndefined();
  expect(
    embedSource('generic', 'http://open.spotify.com/embed', { allowedOrigins }),
  ).toBeUndefined();
});
