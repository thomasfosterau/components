import type { Meta, StoryObj } from '@storybook/sveltekit';
import ImportReadOptions from '../svelte/ImportReadOptions.svelte';
import { sampleRegion, titledRegion } from './demo.ts';

/** The read options over a sample CSV: turn the header off, or skip rows, and watch the preview. */
const meta = {
  title: 'Import/ImportReadOptions',
  component: ImportReadOptions,
  tags: ['autodocs'],
} satisfies Meta<typeof ImportReadOptions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAHeaderRow: Story = {
  args: { table: sampleRegion, read: { headerRow: 0, skipRows: 0 } },
};

export const UnderATitleLine: Story = {
  args: { table: titledRegion, read: { headerRow: 0, skipRows: 0 } },
};
