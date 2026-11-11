import type { Meta, StoryObj } from '@storybook/sveltekit';
import ElapsedTime from '../../lib/formatting/ElapsedTime.svelte';

const meta = {
  title: 'Formatting/ElapsedTime',
  component: ElapsedTime,
  parameters: {
    docs: {
      description: {
        component:
          'Countdown\'s inverse: a named `role="timer"` counting up from `since`, with the digits hidden from assistive technology and a coarse reading instead. `stoppedAt` freezes it; `accumulated` carries earlier runs for pause and resume.',
      },
    },
  },
} satisfies Meta<typeof ElapsedTime>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Running: Story = {
  args: { since: Date.now() - (12 * 60_000 + 4_000), label: 'Watering for' },
};

export const OverAnHour: Story = {
  args: { since: Date.now() - (62 * 60_000 + 3_000), label: 'Drying for' },
};

export const AsText: Story = {
  args: { since: Date.now() - 3 * 60_000, label: 'Running for', display: 'text' },
};

export const Paused: Story = {
  args: {
    since: Date.now() - 30_000,
    stoppedAt: Date.now(),
    accumulated: 60_000,
    label: 'Paused at',
  },
};
