import type { Meta, StoryObj } from '@storybook/sveltekit';
import Chart from '../../lib/charts/Chart.svelte';
import type { ChartSeries } from '../../lib/charts/types.ts';

const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const series = (key: string, label: string, values: readonly number[]): ChartSeries => ({
  key,
  label,
  points: values.map((value, index) => ({ label: MONTHS[index] ?? '', value })),
});

/**
 * The series colours come from the four validated `--color-chart-*` slots in
 * `theme.css`. Switch the Storybook theme while a multi-series story is open:
 * each slot is declared once with `light-dark()`, so both modes are the same
 * four declarations rather than two sets that drift.
 */
const meta = {
  title: 'Charts/Chart',
  component: Chart,
  tags: ['autodocs'],
  argTypes: { kind: { control: 'select', options: ['line', 'area', 'bar'] } },
} satisfies Meta<typeof Chart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One series needs no legend — the title names it. */
export const SingleLine: Story = {
  args: {
    title: 'Observations recorded',
    description: 'Every observation on the account, by month.',
    series: [series('all', 'Observations', [12, 19, 31, 27, 15, 22, 40])],
  },
};

export const FourSeries: Story = {
  args: {
    title: 'Observations by kind',
    kind: 'line',
    series: [
      series('flowering', 'Flowering', [4, 9, 18, 12, 3, 6, 21]),
      series('fruiting', 'Fruiting', [1, 3, 9, 14, 9, 4, 2]),
      series('pest', 'Pest', [6, 5, 3, 1, 2, 9, 12]),
      series('harvest', 'Harvest', [1, 2, 1, 0, 1, 3, 5]),
    ],
  },
};

export const Area: Story = {
  args: {
    title: 'Rainfall',
    kind: 'area',
    formatValue: (value: number) => `${value} mm`,
    series: [series('rain', 'Rainfall', [41, 58, 62, 39, 24, 30, 55])],
  },
};

export const Bars: Story = {
  args: {
    title: 'Harvest weight by bed',
    kind: 'bar',
    formatValue: (value: number) => `${value} kg`,
    series: [
      series('bed1', 'Bed 1', [2, 5, 11, 14, 9, 3, 1]),
      series('bed3', 'Bed 3', [1, 2, 6, 9, 12, 7, 2]),
    ],
  },
};

/**
 * The data table is ALWAYS in the DOM; `showTable` only decides whether
 * sighted readers see it too. This is the relief the palette's contrast note
 * calls for, made visible.
 */
export const WithTheTable: Story = {
  args: {
    title: 'Observations by kind',
    showTable: true,
    tableLabel: 'Observations by kind and month',
    series: [
      series('flowering', 'Flowering', [4, 9, 18, 12, 3, 6, 21]),
      series('fruiting', 'Fruiting', [1, 3, 9, 14, 9, 4, 2]),
    ],
  },
};

/** A fifth series draws in the neutral slot rather than a generated hue. */
export const PastTheSlotCap: Story = {
  args: {
    title: 'Five series is a design problem',
    description: 'The fifth draws in the neutral slot; fold it into an “other” series instead.',
    series: [
      series('a', 'Flowering', [4, 9, 18, 12, 3, 6, 21]),
      series('b', 'Fruiting', [1, 3, 9, 14, 9, 4, 2]),
      series('c', 'Pest', [6, 5, 3, 1, 2, 9, 12]),
      series('d', 'Harvest', [1, 2, 1, 0, 1, 3, 5]),
      series('e', 'Other', [2, 2, 4, 3, 2, 1, 6]),
    ],
  },
};

/** Every string is a prop, the legend's and the table's names included. */
export const CopyIsAProp: Story = {
  args: {
    title: 'Observations par type',
    legendLabel: 'Types d’observation',
    tableLabel: 'Observations par type et par mois',
    categoryLabel: 'Mois',
    showTable: true,
    series: [
      series('a', 'Floraison', [4, 9, 18, 12, 3, 6, 21]),
      series('b', 'Fructification', [1, 3, 9, 14, 9, 4, 2]),
    ],
  },
};

export const Empty: Story = { args: { title: 'Nothing recorded yet', series: [] } };
