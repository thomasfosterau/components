/** A garden's harvest log: the records the pivot tests and stories pivot. */
export interface Harvest {
  readonly bed: string;
  readonly crop: string;
  readonly date: string;
  readonly kg: number | null;
}

export const harvests: readonly Harvest[] = [
  { bed: 'Bed 1', crop: 'Tomato', date: '2026-01-14', kg: 2.5 },
  { bed: 'Bed 1', crop: 'Tomato', date: '2026-02-03', kg: 3 },
  { bed: 'Bed 1', crop: 'Basil', date: '2026-01-20', kg: 0.5 },
  { bed: 'Bed 2', crop: 'Tomato', date: '2026-02-11', kg: 4 },
  { bed: 'Bed 2', crop: 'Zucchini', date: '2026-02-18', kg: 6 },
  { bed: 'Bed 10', crop: 'Basil', date: '2026-01-05', kg: null },
];
