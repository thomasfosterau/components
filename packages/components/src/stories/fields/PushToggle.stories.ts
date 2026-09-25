import type { Meta, StoryObj } from '@storybook/sveltekit';
import PushToggle from '../../lib/fields/PushToggle.svelte';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const meta = {
  title: 'Fields/PushToggle',
  component: PushToggle,
  args: {
    available: true,
    supported: true,
    readSubscribed: async () => false,
    enable: async () => {
      await wait(600);
      return { _tag: 'enabled' as const };
    },
    disable: async () => wait(400),
  },
  parameters: {
    docs: {
      description: {
        component:
          "Web Push for this browser behind one `Toggle`. `enable` / `disable` are the app's own client calls; `enable` resolves with an outcome, and each refusal gets its own message. The stories stub the browser checks, so nothing here touches the real `PushManager`.",
      },
    },
  },
} satisfies Meta<typeof PushToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const AlreadySubscribed: Story = { args: { readSubscribed: async () => true } };

export const PermissionDenied: Story = {
  args: {
    enable: async () => {
      await wait(400);
      return { _tag: 'denied' as const };
    },
  },
};

export const UnsupportedBrowser: Story = { args: { supported: false } };

export const NotConfigured: Story = { args: { available: false } };
