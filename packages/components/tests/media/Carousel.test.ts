import { createRawSnippet } from 'svelte';
import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import Carousel from '../../src/lib/media/Carousel.svelte';
import CarouselFixture from './fixtures/CarouselFixture.svelte';
import CarouselStaleFixture from './fixtures/CarouselStaleFixture.svelte';

const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

test('is a region named by label, with the carousel role description', async () => {
  const screen = await render(CarouselFixture);

  const region = screen.getByRole('region', { name: 'Photos of Bed 4' });
  await expect.element(region).toHaveAttribute('aria-roledescription', 'carousel');
});

test('each slide is a group named by its position', async () => {
  const screen = await render(CarouselFixture);

  const groups = screen.getByRole('group').all();
  expect(groups).toHaveLength(5);
  await expect.element(groups[1]!).toHaveAccessibleName('2 of 5');
  await expect.element(groups[1]!).toHaveAttribute('aria-roledescription', 'slide');
});

test('Next and Previous move the bound index and the current picker, and are disabled at the ends', async () => {
  const screen = await render(CarouselFixture, { count: 2 });
  const previous = screen.getByRole('button', { name: 'Previous slide' });
  const next = screen.getByRole('button', { name: 'Next slide' });

  await expect.element(previous).toBeDisabled();
  await expect
    .element(screen.getByRole('button', { name: 'Slide 1' }))
    .toHaveAttribute('aria-current', 'true');

  await next.click();
  await expect.element(screen.getByTestId('index')).toHaveTextContent('1');
  await expect
    .element(screen.getByRole('button', { name: 'Slide 2' }))
    .toHaveAttribute('aria-current', 'true');
  await expect
    .element(screen.getByRole('button', { name: 'Slide 1' }))
    .not.toHaveAttribute('aria-current');
  await expect.element(next).toBeDisabled();

  await previous.click();
  await expect.element(screen.getByTestId('index')).toHaveTextContent('0');
});

test('a picker scrolls to its slide', async () => {
  const screen = await render(CarouselFixture);

  await screen.getByRole('button', { name: 'Slide 4' }).click();
  await expect.element(screen.getByTestId('index')).toHaveTextContent('3');
  await expect.element(screen.getByRole('link', { name: 'Photo 4' })).toBeInViewport();
});

test('controls point aria-controls at the slide container', async () => {
  const screen = await render(CarouselFixture);

  const next = screen.getByRole('button', { name: 'Next slide' }).element();
  const controlled = document.getElementById(next.getAttribute('aria-controls') ?? '');
  expect(controlled?.querySelectorAll('[role="group"]')).toHaveLength(5);
});

test('without autoplay there is no rotation control and the slides are a polite live region', async () => {
  const screen = await render(CarouselFixture);

  await expect
    .element(screen.getByRole('button', { name: /automatic slide show/ }))
    .not.toBeInTheDocument();
  const next = screen.getByRole('button', { name: 'Next slide' }).element();
  const slides = document.getElementById(next.getAttribute('aria-controls') ?? '');
  expect(slides?.getAttribute('aria-live')).toBe('polite');
});

test('pickers={false} drops the picker row', async () => {
  const screen = await render(CarouselFixture, { pickers: false });

  await expect.element(screen.getByRole('button', { name: 'Slide 1' })).not.toBeInTheDocument();
});

test('autoplay advances, with the live region off and the rotation control first in tab order', async () => {
  const screen = await render(CarouselFixture, { autoplay: 100 });
  // Earlier tests leave the pointer where the carousel now is, which pauses
  // it, and the focus start point inside it; begin from the button before it.
  await screen.getByRole('button', { name: 'Before the carousel' }).click();

  const stop = screen.getByRole('button', { name: 'Stop automatic slide show' });
  await expect.element(stop).toBeInTheDocument();
  const slides = document.getElementById(
    screen.getByRole('button', { name: 'Next slide' }).element().getAttribute('aria-controls') ??
      '',
  );
  expect(slides?.getAttribute('aria-live')).toBe('off');
  await expect.element(screen.getByTestId('index')).not.toHaveTextContent('0');

  await userEvent.tab();
  await expect
    .element(screen.getByRole('button', { name: 'Start automatic slide show' }))
    .toHaveFocus();
});

test('keyboard focus inside stops rotation until the control restarts it', async () => {
  const screen = await render(CarouselFixture, { autoplay: 100 });
  // Earlier tests leave the pointer where the carousel now is, which pauses
  // it, and the focus start point inside it; begin from the button before it.
  await screen.getByRole('button', { name: 'Before the carousel' }).click();

  await userEvent.tab();
  const start = screen.getByRole('button', { name: 'Start automatic slide show' });
  await expect.element(start).toBeInTheDocument();
  const stoppedAt = screen.getByTestId('index').element().textContent;
  await pause(400);
  expect(screen.getByTestId('index').element().textContent).toBe(stoppedAt);
  const slides = document.getElementById(
    screen.getByRole('button', { name: 'Next slide' }).element().getAttribute('aria-controls') ??
      '',
  );
  expect(slides?.getAttribute('aria-live')).toBe('polite');

  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByRole('button', { name: 'Stop automatic slide show' }))
    .toBeInTheDocument();
  await expect.element(screen.getByTestId('index')).not.toHaveTextContent(stoppedAt ?? '');
});

test('spreads native attributes and merges class', async () => {
  const slide = createRawSnippet((item: () => unknown) => ({
    render: () => `<span>${String(item())}</span>`,
  }));
  const screen = await render(Carousel, {
    items: ['One', 'Two'],
    label: 'Two slides',
    slide,
    id: 'my-carousel',
    class: 'mine',
    'data-testid': 'carousel',
  });

  const region = screen.getByTestId('carousel');
  await expect.element(region).toHaveAttribute('id', 'my-carousel');
  await expect.element(region).toHaveClass('mine');
  await expect.element(region).toHaveClass('flex');
});

test('a late observer batch describing the old position does not pull the index back', async () => {
  const native = window.IntersectionObserver;
  const callbacks: IntersectionObserverCallback[] = [];
  // Capture each observer's callback so the test can deliver a stale batch at will.
  window.IntersectionObserver = class extends native {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      super(callback, options);
      callbacks.push(callback);
    }
  };
  try {
    const screen = await render(CarouselStaleFixture);
    await screen.getByRole('button', { name: 'Jump' }).click();
    await expect.element(screen.getByTestId('index')).toHaveTextContent('1');
    // Only the carousel's own observer is captured: toBeInViewport makes its own.
    window.IntersectionObserver = native;
    expect(callbacks).toHaveLength(1);
    await expect.element(screen.getByText('Photo 2')).toBeInViewport();
    // Let the smooth scroll finish, as in the race: the stale batch lands after it.
    await pause(600);

    // The initial "slide 1 intersecting" batch, delivered only now.
    const first = screen.getByRole('group').all()[0]?.element();
    if (first === undefined) throw new TypeError('no slides');
    const stale: IntersectionObserverEntry = Object.create(IntersectionObserverEntry.prototype);
    Object.defineProperty(stale, 'isIntersecting', { value: true });
    Object.defineProperty(stale, 'target', { value: first });
    for (const callback of callbacks) callback([stale], new native(() => {}));
    await expect.element(screen.getByTestId('index')).toHaveTextContent('1');
  } finally {
    window.IntersectionObserver = native;
  }
});
