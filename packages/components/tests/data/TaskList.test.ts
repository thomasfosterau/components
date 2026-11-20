/**
 * `TaskList` pins GOV.UK's task-list contract: the title is the row's one
 * link, described by its hint and status, and a task that cannot start yet
 * is text, not a link.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import TaskList from '../../src/lib/data/TaskList.svelte';
import type { TaskListSection } from '../../src/lib/data/task-list.ts';

const sections: readonly TaskListSection[] = [
  {
    title: 'Set up your garden',
    tasks: [
      { id: 'beds', title: 'Add beds', href: '/beds', status: 'completed' },
      {
        id: 'zone',
        title: 'Choose a climate zone',
        href: '/zone',
        hint: 'Sets your frost dates',
        status: 'in-progress',
      },
    ],
  },
  {
    title: 'Share it',
    tasks: [
      { id: 'invite', title: 'Invite collaborators', href: '/invite', status: 'not-started' },
      { id: 'publish', title: 'Publish the plan', href: '/publish', status: 'cannot-start' },
      { id: 'roles', title: 'Assign roles', href: '/roles', status: 'completed' },
    ],
  },
];

test('names each task link by its title and describes it by its hint and status', async () => {
  const screen = await render(TaskList, { sections });

  await expect
    .element(screen.getByRole('link', { name: 'Add beds' }))
    .toHaveAccessibleDescription('Completed');
  await expect
    .element(screen.getByRole('link', { name: 'Choose a climate zone' }))
    .toHaveAccessibleDescription('Sets your frost dates In progress');
});

test('renders a task that cannot start yet as text with its status, not a link', async () => {
  const screen = await render(TaskList, { sections });

  expect(screen.getByRole('link', { name: 'Publish the plan' }).elements()).toHaveLength(0);
  const row = screen.getByRole('listitem').filter({ hasText: 'Publish the plan' });
  await expect.element(row).toHaveTextContent('Cannot start yet');
});

test('gives each row exactly one focusable element', async () => {
  const screen = await render(TaskList, { sections });

  for (const row of screen.getByRole('listitem').elements()) {
    const linked = !row.textContent?.includes('Publish the plan');
    expect(row.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(linked ? 1 : 0);
  }
});

test('summarises completed tasks across every section', async () => {
  const screen = await render(TaskList, { sections });

  await expect.element(screen.getByText('You have completed 2 of 5 tasks')).toBeInTheDocument();
  const progress = screen.getByRole('progressbar', { name: 'Tasks completed' });
  await expect.element(progress).toHaveAttribute('value', '2');
  await expect.element(progress).toHaveAttribute('max', '5');
});

test('omits the summary when asked, or when there are no tasks', async () => {
  const off = await render(TaskList, { sections, summary: false });
  expect(off.getByRole('progressbar').elements()).toHaveLength(0);
  await off.unmount();

  const empty = await render(TaskList, { sections: [{ tasks: [] }] });
  expect(empty.getByRole('progressbar').elements()).toHaveLength(0);
});

test('puts section titles at the given heading level, and none for an untitled section', async () => {
  const screen = await render(TaskList, { sections, level: 3 });

  await expect
    .element(screen.getByRole('heading', { name: 'Set up your garden', level: 3 }))
    .toBeInTheDocument();
  expect(screen.getByRole('list').elements()).toHaveLength(2);

  await screen.unmount();
  const flat = await render(TaskList, { sections: [{ tasks: sections[0]!.tasks }] });
  expect(flat.getByRole('heading').elements()).toHaveLength(0);
});

test('applies statusLabels over the defaults and summaryLabel to the summary', async () => {
  const screen = await render(TaskList, {
    sections,
    statusLabels: { completed: 'Done' },
    summaryLabel: (done, total) => `${done}/${total}`,
  });

  await expect
    .element(screen.getByRole('link', { name: 'Add beds' }))
    .toHaveAccessibleDescription('Done');
  await expect
    .element(screen.getByRole('link', { name: 'Invite collaborators' }))
    .toHaveAccessibleDescription('Not started');
  await expect.element(screen.getByText('2/5')).toBeInTheDocument();
});
