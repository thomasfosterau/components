import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Infobox from '../../src/lib/infobox/Infobox.svelte';
import InfoboxLinksRowContextFixture from './fixtures/InfoboxLinksRowContextFixture.svelte';
import InfoboxRowsAndChildrenFixture from './fixtures/InfoboxRowsAndChildrenFixture.svelte';
import { htmlSnippet } from './snippets.ts';

test('is a labelled complementary region, kept as data-testid="infobox" for e2e parity', async () => {
  const screen = await render(Infobox, { title: 'Solanum lycopersicum' });

  const aside = screen.getByRole('complementary', { name: 'Solanum lycopersicum' });
  await expect.element(aside).toBeInTheDocument();
  await expect.element(screen.getByTestId('infobox')).toBeInTheDocument();
});

test('falls back to label for its accessible name when there is no title', async () => {
  const screen = await render(Infobox, { label: 'Key facts' });

  await expect
    .element(screen.getByRole('complementary', { name: 'Key facts' }))
    .toBeInTheDocument();
});

test('a real title wins over the generic label', async () => {
  const screen = await render(Infobox, { title: 'Grayndler', label: 'Key facts' });

  await expect
    .element(screen.getByRole('complementary', { name: 'Grayndler' }))
    .toBeInTheDocument();
});

test('renders rows as one dt/dd list inside one dl', async () => {
  const screen = await render(Infobox, {
    rows: [
      { kind: 'fact', label: 'Family', value: 'Solanaceae' },
      { kind: 'fact', label: 'Genus', value: 'Solanum' },
    ],
  });

  const dls = screen.container.querySelectorAll('dl');
  expect(dls).toHaveLength(1);
  expect(screen.container.querySelectorAll('dt')).toHaveLength(2);
});

test('sparse rows (unrecorded facts, empty link lists) render nothing for that row', async () => {
  const screen = await render(Infobox, {
    title: 'Bed 3',
    rows: [
      { kind: 'fact', label: 'Area', value: '4.2 m²' },
      { kind: 'fact', label: 'Frost tolerance', value: undefined },
      { kind: 'links', label: 'Neighbours', links: [] },
      { kind: 'links', label: 'Companions', links: undefined },
    ],
  });

  await expect.element(screen.getByText('Area')).toBeInTheDocument();
  expect(screen.container.textContent).not.toContain('Frost tolerance');
  expect(screen.container.textContent).not.toContain('Neighbours');
  expect(screen.container.textContent).not.toContain('Companions');
});

test('renders each row kind: fact, link, links, image and custom', async () => {
  const screen = await render(Infobox, {
    title: 'The Great Gatsby',
    rows: [
      { kind: 'image', src: '/cover.jpg', alt: 'Cover of The Great Gatsby' },
      { kind: 'fact', label: 'Publisher', value: 'Scribner' },
      { kind: 'link', label: 'Author', text: 'F. Scott Fitzgerald', href: '/people/fsf' },
      {
        kind: 'links',
        label: 'Editors',
        links: [{ label: 'Maxwell Perkins', href: '/people/perkins' }],
      },
      {
        kind: 'custom',
        label: 'Status',
        content: htmlSnippet('<span data-testid="status">In print</span>'),
      },
    ],
  });

  await expect
    .element(screen.getByRole('img', { name: 'Cover of The Great Gatsby' }))
    .toBeInTheDocument();
  await expect.element(screen.getByText('Scribner')).toBeInTheDocument();
  await expect
    .element(screen.getByRole('link', { name: 'F. Scott Fitzgerald' }))
    .toHaveAttribute('href', '/people/fsf');
  await expect
    .element(screen.getByRole('link', { name: 'Maxwell Perkins' }))
    .toHaveAttribute('href', '/people/perkins');
  await expect.element(screen.getByTestId('status')).toHaveTextContent('In print');
});

test('an eager image (via the image prop) gets fetchpriority="high" and loading="eager"', async () => {
  const screen = await render(Infobox, {
    title: 'Anthony Albanese',
    image: { src: '/albanese.jpg', alt: 'Anthony Albanese', width: 400, height: 600, eager: true },
  });

  const image = screen.getByRole('img', { name: 'Anthony Albanese' });
  await expect.element(image).toHaveAttribute('loading', 'eager');
  await expect.element(image).toHaveAttribute('fetchpriority', 'high');
  await expect.element(image).toHaveAttribute('width', '400');
  await expect.element(image).toHaveAttribute('height', '600');
});

test('an eager image row gets the same LCP treatment as the image prop', async () => {
  const screen = await render(Infobox, {
    rows: [{ kind: 'image', src: '/cover.jpg', alt: 'Cover', eager: true }],
  });

  const image = screen.getByRole('img', { name: 'Cover' });
  await expect.element(image).toHaveAttribute('loading', 'eager');
  await expect.element(image).toHaveAttribute('fetchpriority', 'high');
});

test('is unfloated by default', async () => {
  const screen = await render(Infobox, { title: 'Bed 3' });
  await expect.element(screen.getByTestId('infobox')).not.toHaveClass('float-right');
});

test('float adds float-right rail classes', async () => {
  const screen = await render(Infobox, { title: 'Bed 3', float: true });
  await expect.element(screen.getByTestId('infobox')).toHaveClass('float-right');
});

test('renders children when given, with no rows at all', async () => {
  const screen = await render(Infobox, {
    title: 'Bed 3',
    children: htmlSnippet('<p>Composed body</p>'),
  });

  await expect.element(screen.getByText('Composed body')).toBeInTheDocument();
});

test('renders rows and children together, rows first', async () => {
  const screen = await render(InfoboxRowsAndChildrenFixture);

  await expect.element(screen.getByText('Area')).toBeInTheDocument();
  await expect.element(screen.getByText('4.2 m²')).toBeInTheDocument();
  await expect.element(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
  await expect.element(screen.getByText('Last sown')).toBeInTheDocument();
});

test('a links row resolves each href through the components context', async () => {
  const screen = await render(InfoboxLinksRowContextFixture);

  await expect
    .element(screen.getByRole('link', { name: 'Anthony Albanese' }))
    .toHaveAttribute('href', '/en/people/albanese');
});
