import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import TooltipFixture from './fixtures/TooltipFixture.svelte';

test('opens on keyboard focus and describes — never labels — the trigger', async () => {
  const screen = await render(TooltipFixture, {
    text: 'Published gardens are visible to everyone.',
    triggerLabel: 'Publish',
  });

  const trigger = screen.getByRole('button', { name: 'Publish' });
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await expect
    .element(screen.getByText('Published gardens are visible to everyone.'))
    .toBeVisible();
  // The tooltip supplements the name; it must not become it.
  await expect.element(trigger).toHaveAccessibleName('Publish');
  await expect
    .element(trigger)
    .toHaveAccessibleDescription('Published gardens are visible to everyone.');
});

test('needs no app-wide Tooltip.Provider to work', async () => {
  // Nothing mounts a provider here: the component carries its own, which is
  // the whole reason it exists rather than a bare bits-ui re-export.
  const screen = await render(TooltipFixture, { text: 'Hello', triggerLabel: 'Trigger' });

  await userEvent.hover(screen.getByRole('button', { name: 'Trigger' }));

  await expect.element(screen.getByText('Hello')).toBeVisible();
});

test('closes on Escape', async () => {
  const screen = await render(TooltipFixture, { text: 'Hello', triggerLabel: 'Trigger' });

  await userEvent.tab();
  await expect.element(screen.getByText('Hello')).toBeVisible();

  await userEvent.keyboard('{Escape}');

  expect(screen.getByText('Hello').elements()).toHaveLength(0);
});
