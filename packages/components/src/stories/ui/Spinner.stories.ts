import type { Meta, StoryObj } from '@storybook/sveltekit';
import Spinner from '../../lib/ui/Spinner.svelte';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    docs: {
      description: {
        component:
          'An indeterminate loading indicator in daisyUI’s `loading` shapes, announced as a polite `status` named by `label`. Use `Skeleton` when the content’s shape is known; `decorative` when something else (a busy button, a live region) already says it is loading.',
      },
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dots: Story = { args: { variant: 'dots', size: 'lg' } };
export const Ring: Story = { args: { variant: 'ring', size: 'xl', tone: 'primary' } };
export const Ball: Story = { args: { variant: 'ball', tone: 'secondary' } };
export const Bars: Story = { args: { variant: 'bars', size: 'sm' } };
export const InfinityShape: Story = { args: { variant: 'infinity', size: 'lg', tone: 'accent' } };
export const LabelShown: Story = { args: { label: 'Fetching seed list', showLabel: true } };
export const Decorative: Story = { args: { decorative: true, size: 'xs' } };
