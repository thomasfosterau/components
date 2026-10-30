import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Rating from '../../src/lib/fields/Rating.svelte';
import RatingFormFixture from './fixtures/RatingFormFixture.svelte';

/** The bits-ui item wrappers, in order; each is one star. */
function stars(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-rating-group-item]'));
}

test('inside FormField it is a slider named by the label, reporting its value', async () => {
  const screen = await render(RatingFormFixture, {});

  const rating = screen.getByRole('slider', { name: 'How well did it grow?' });
  await expect.element(rating).toHaveAttribute('aria-valuenow', '3');
  await expect.element(rating).toHaveAttribute('aria-valuemax', '5');
  await expect.element(rating).toHaveAttribute('aria-valuetext', '3 out of 5');
  await expect.element(rating).toHaveAccessibleDescription(/Five is a bumper crop\./);
});

test('a click on the FormField label focuses it', async () => {
  const screen = await render(RatingFormFixture, {});

  await screen.getByText('How well did it grow?').click();
  await expect.element(screen.getByRole('slider')).toHaveFocus();
});

test('ArrowRight adds a star; with allowHalf it adds half of one', async () => {
  const whole = await render(Rating, { label: 'Score', value: 3 });
  const slider = whole.getByRole('slider', { name: 'Score' });
  (slider.element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '4');
  await whole.unmount();

  const half = await render(Rating, { label: 'Score', value: 3, allowHalf: true });
  const halfSlider = half.getByRole('slider', { name: 'Score' });
  (halfSlider.element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(halfSlider).toHaveAttribute('aria-valuenow', '3.5');
  await expect.element(halfSlider).toHaveAttribute('aria-valuetext', '3.5 out of 5');
});

test('Home and End go to the ends', async () => {
  const screen = await render(Rating, { label: 'Score', value: 3 });
  const slider = screen.getByRole('slider');
  (slider.element() as HTMLElement).focus();
  await userEvent.keyboard('{End}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '5');
  await userEvent.keyboard('{Home}');
  await expect.element(slider).toHaveAttribute('aria-valuenow', '0');
});

test('clicking the fourth star sets the bound value to 4', async () => {
  const screen = await render(RatingFormFixture, {});

  const fourth = stars(screen.getByRole('slider').element() as HTMLElement)[3];
  expect(fourth).toBeDefined();
  // The suite loads no Tailwind CSS, so a star has no box to aim a pointer at; dispatch the click.
  (fourth as HTMLElement).click();

  await expect.element(screen.getByText('Bound: 4')).toBeInTheDocument();
  await expect.element(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '4');
});

test('a wrapping form posts the value under name', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(RatingFormFixture, { onSubmitted });

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onSubmitted).toHaveBeenCalledOnce();
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.get('score')).toBe('3');
});

test('formatValue sets the spoken value', async () => {
  const screen = await render(Rating, {
    label: 'Score',
    value: 2,
    formatValue: (value: number, max: number) => `${value} of ${max} stars`,
  });

  await expect
    .element(screen.getByRole('slider'))
    .toHaveAttribute('aria-valuetext', '2 of 5 stars');
});

test('readonly renders a named image with nothing focusable in it', async () => {
  const screen = await render(Rating, { value: 4.5, readonly: true });

  const display = screen.getByRole('img', { name: '4.5 out of 5' });
  await expect.element(display).toBeInTheDocument();
  expect(screen.getByRole('slider').elements()).toHaveLength(0);
  const root = display.element() as HTMLElement;
  expect(root.querySelectorAll('[tabindex], input, button')).toHaveLength(0);
  expect(root.tabIndex).toBe(-1);
});

test('invalid sets aria-invalid', async () => {
  const screen = await render(RatingFormFixture, { errors: ['Rate it before saving.'] });

  await expect.element(screen.getByRole('slider')).toHaveAttribute('aria-invalid', 'true');
});

test('disabled blocks keys and clicks and posts nothing', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(RatingFormFixture, { disabled: true, onSubmitted });

  const slider = screen.getByRole('slider');
  await expect.element(slider).toHaveAttribute('aria-disabled', 'true');
  await expect.element(slider).toHaveAttribute('tabindex', '-1');

  (slider.element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  const fifth = stars(slider.element() as HTMLElement)[4];
  (fifth as HTMLElement).click();
  await expect.element(slider).toHaveAttribute('aria-valuenow', '3');

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.has('score')).toBe(false);
});
