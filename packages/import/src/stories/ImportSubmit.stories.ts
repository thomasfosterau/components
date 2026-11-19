import type { Meta, StoryObj } from '@storybook/sveltekit';
import ImportSubmit from '../svelte/ImportSubmit.svelte';
import { contactTarget, pretendToSave, sampleSpec, sampleTable } from './demo.ts';

/** The last step over a sample table with one row the target rejects. */
const meta = {
  title: 'Import/ImportSubmit',
  component: ImportSubmit,
  tags: ['autodocs'],
  args: { target: contactTarget, spec: sampleSpec, table: sampleTable, onSubmit: pretendToSave },
} satisfies Meta<typeof ImportSubmit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RowsWithIssuesBlockTheImport: Story = {};

export const RowsWithIssuesLeftOut: Story = {
  args: { invalidRows: 'exclude' },
};

export const RowsWithIssuesPassedOn: Story = {
  args: { invalidRows: 'allow' },
};
