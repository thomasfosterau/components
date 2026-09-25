import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ThesisCitation from '../../src/lib/citations/ThesisCitation.svelte';

const text = (container: HTMLElement): string =>
  container.textContent?.replace(/\s+/g, ' ').trim() ?? '';

test('renders the title inside a <cite>, with Thesis microdata', async () => {
  const screen = await render(ThesisCitation, { thesis: { title: 'On Roses' } });
  expect(screen.container.querySelector('cite')).toHaveTextContent('On Roses');
  expect(screen.container.querySelector("[itemtype='https://schema.org/Thesis']")).not.toBeNull();
});

test("falls back to 'Untitled thesis'", async () => {
  const screen = await render(ThesisCitation, { thesis: {} });
  expect(text(screen.container)).toBe('Untitled thesis');
});

test('renders author, year, degree and awarding institution', async () => {
  const screen = await render(ThesisCitation, {
    thesis: {
      title: 'On Roses',
      authors: [{ name: 'J. Smith' }],
      datePublished: 1998,
      degree: 'PhD',
      institution: { name: 'University of Sydney' },
    },
  });
  expect(text(screen.container)).toBe('J. Smith, On Roses (1998) PhD thesis, University of Sydney');
  expect(screen.container.querySelector("[itemprop='sourceOrganization']")).toHaveTextContent(
    'University of Sydney',
  );
});

test('the degree label is a prop', async () => {
  const screen = await render(ThesisCitation, {
    thesis: { title: 'T', degree: 'PhD' },
    degreeLabel: (degree) => `tesis de ${degree ?? 'grado'}`,
  });
  expect(text(screen.container)).toContain('tesis de PhD');
});
