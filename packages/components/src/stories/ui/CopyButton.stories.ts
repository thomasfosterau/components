import type { Meta, StoryObj } from '@storybook/sveltekit';
import CopyButton from '../../lib/ui/CopyButton.svelte';

const meta = {
  title: 'UI/CopyButton',
  component: CopyButton,
  args: { value: 'https://example.com/gardens/7' },
  parameters: {
    docs: {
      description: {
        component:
          'Copies a value to the clipboard. The accessible name never changes; the icon swaps to a check and a polite status announces "Copied" (or "Could not copy", which is also reported through `onError`).',
      },
    },
  },
} satisfies Meta<typeof CopyButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithItsOwnLabel: Story = { args: { label: 'Copy link', variant: 'outline' } };
export const IconOnly: Story = {
  args: { label: 'Copy garden id', iconOnly: true, value: 'gdn_7f3a' },
};
