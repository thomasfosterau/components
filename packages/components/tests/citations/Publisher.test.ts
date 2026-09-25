import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Publisher from '../../src/lib/citations/Publisher.svelte';

test('renders the name with itemprop=name inside an Organization publisher by default', async () => {
  const screen = await render(Publisher, { publisher: { name: 'Oxford University Press' } });
  const name = screen.container.querySelector("[itemprop='name']");
  expect(name).toHaveTextContent('Oxford University Press');
  expect(name?.closest("[itemprop='publisher']")).toHaveAttribute(
    'itemtype',
    'https://schema.org/Organization',
  );
});

test('renders a Person publisher with the Person itemtype and no address', async () => {
  const screen = await render(Publisher, {
    publisher: { name: 'A Self Publisher', itemtype: 'Person' },
  });
  expect(screen.container.querySelector("[itemprop='publisher']")).toHaveAttribute(
    'itemtype',
    'https://schema.org/Person',
  );
  expect(screen.container.querySelector("[itemprop='location']")).toBeNull();
});

test('maps locality / region / country onto the Schema.org PostalAddress itemprops', async () => {
  const screen = await render(Publisher, {
    publisher: {
      name: 'Oxford University Press',
      address: { locality: 'Oxford', region: 'Oxfordshire', country: 'UK' },
    },
  });
  const { container } = screen;
  expect(container.querySelector("[itemprop='addressLocality']")).toHaveTextContent('Oxford');
  expect(container.querySelector("[itemprop='addressRegion']")).toHaveTextContent('Oxfordshire');
  expect(container.querySelector("[itemprop='addressCountry']")).toHaveTextContent('UK');
  expect(container.querySelector("[itemprop='location']")).toHaveAttribute(
    'itemtype',
    'https://schema.org/PostalAddress',
  );
  expect(container.textContent?.replace(/\s+/g, ' ').trim()).toBe(
    'Oxford, Oxfordshire, UK: Oxford University Press',
  );
});

test('renders only the address parts that are present', async () => {
  const screen = await render(Publisher, {
    publisher: { name: 'Sole Locality Press', address: { locality: 'Sydney' } },
  });
  expect(screen.container.querySelector("[itemprop='addressLocality']")).toHaveTextContent(
    'Sydney',
  );
  expect(screen.container.querySelector("[itemprop='addressRegion']")).toBeNull();
});

test('renders no PostalAddress, and no colon, when the address has no usable parts', async () => {
  const screen = await render(Publisher, {
    publisher: { name: 'Empty Address Press', address: { locality: '' } },
  });
  expect(screen.container.querySelector("[itemprop='location']")).toBeNull();
  expect(screen.container.textContent).not.toContain(':');
});

test('takes its itemprop as a prop', async () => {
  const screen = await render(Publisher, {
    publisher: { name: 'University of Sydney' },
    itemprop: 'sourceOrganization',
  });
  expect(screen.container.querySelector("[itemprop='sourceOrganization']")).not.toBeNull();
});
