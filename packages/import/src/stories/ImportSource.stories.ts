import type { Meta, StoryObj } from '@storybook/sveltekit';
import ImportSource from '../svelte/ImportSource.svelte';
import { formats } from './demo.ts';

/** Pick any CSV or TSV file: the step detects its format and shows why. */
const meta = {
  title: 'Import/ImportSource',
  component: ImportSource,
  tags: ['autodocs'],
} satisfies Meta<typeof ImportSource>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CsvOrTsv: Story = {
  args: { formats },
};

export const CsvOnly: Story = {
  args: { formats: formats.slice(0, 1), fileLabel: 'Contact list (CSV)' },
};
