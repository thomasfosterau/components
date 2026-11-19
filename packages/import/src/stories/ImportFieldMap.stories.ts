import type { Meta, StoryObj } from '@storybook/sveltekit';
import ImportFieldMap from '../svelte/ImportFieldMap.svelte';
import { contactTarget, sampleRegion } from './demo.ts';

/** The field map over a sample CSV, pre-filled from its headers. */
const meta = {
  title: 'Import/ImportFieldMap',
  component: ImportFieldMap,
  tags: ['autodocs'],
} satisfies Meta<typeof ImportFieldMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SuggestedFromTheHeaders: Story = {
  args: { target: contactTarget, table: sampleRegion, read: { headerRow: 0, skipRows: 0 } },
};

export const RequiredFieldsShownAsErrors: Story = {
  args: { target: contactTarget, table: sampleRegion, read: { skipRows: 0 }, showErrors: true },
};
