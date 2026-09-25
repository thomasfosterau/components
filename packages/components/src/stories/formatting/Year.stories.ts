import type { Meta, StoryObj } from '@storybook/sveltekit';
import Year from '../../lib/formatting/Year.svelte';

const meta = {
  title: 'Formatting/Year',
  component: Year,
  parameters: {
    docs: {
      description: {
        component:
          'A `<time>` carrying just a year: `datetime="1925"` and the locale rendering. A number is a calendar year; a date or string contributes its UTC year.',
      },
    },
  },
} satisfies Meta<typeof Year>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CalendarYear: Story = { args: { value: 1925, locales: 'en-AU' } };

export const FromADate: Story = { args: { value: '2026-09-17T09:30:00Z', locales: 'en-AU' } };

export const WithEra: Story = { args: { value: 1925, era: 'long', locales: 'en-AU' } };

export const TwoDigit: Story = {
  args: { value: 1925, representation: '2-digit', locales: 'en-AU' },
};

export const JapaneseCalendar: Story = {
  args: { value: 2026, era: 'long', locales: 'ja-JP-u-ca-japanese' },
};
