import type { Channel, ChartSpec, Datum, Encoding, UnsupportedMarkSpec } from '../spec/index.ts';
import { makeAccessor, type FieldValue } from './accessor.ts';
import type { DataRows } from './types.ts';

/** One column of a {@link DataTable}. */
export interface DataTableColumn {
  /** The encoding channels the column shows: one, or a range's start and end (`x` and `x2`). */
  readonly channels: ReadonlyArray<keyof Encoding>;
  /** The header: the channel's field, or a range's two fields joined by the range separator. */
  readonly header: string;
}

/**
 * A chart's data as a table: the text alternative every interpreter renders
 * beside its drawing (visually hidden), and in place of a mark it does not
 * know (visible). Every cell is text, formatted from its channel's declared
 * type, never by sniffing the value.
 */
export interface DataTable {
  /** The spec's `config.title`, for the table's caption. */
  readonly caption: string | undefined;
  readonly columns: ReadonlyArray<DataTableColumn>;
  /** One entry per data row, in data order, each with one cell per column. */
  readonly rows: ReadonlyArray<ReadonlyArray<string>>;
}

/** Options for {@link buildDataTable}. */
export interface DataTableOptions {
  /**
   * Joins a range's start and end, in its header and its cells.
   * @defaultValue ' to '
   */
  readonly rangeSeparator?: string | undefined;
}

/** The default {@link DataTableOptions.rangeSeparator}. */
export const DEFAULT_RANGE_SEPARATOR = ' to ';

/** A column before its cells are read: its channels, each with its spec channel. */
type ColumnSource = ReadonlyArray<readonly [keyof Encoding, Channel]>;

/**
 * The column order for every mark but `tree`: each position with its range
 * end, then the `tree` channels (an unknown mark may use them), then colour,
 * size and opacity.
 */
const CHANNEL_GROUPS: ReadonlyArray<ReadonlyArray<keyof Encoding>> = [
  ['x', 'x2'],
  ['y', 'y2'],
  ['id'],
  ['label'],
  ['parent'],
  ['color'],
  ['size'],
  ['opacity'],
];

/** A `tree`'s columns: a node's name (its label, else its id), then its parent, then the rest. */
function treeGroups(encoding: Encoding): ReadonlyArray<ReadonlyArray<keyof Encoding>> {
  return [
    [encoding.label === undefined ? 'id' : 'label'],
    ['parent'],
    ['color'],
    ['size'],
    ['opacity'],
  ];
}

/** A cell's text: dates as ISO 8601 (the date alone at UTC midnight), everything else as written. */
function formatValue(value: FieldValue): string {
  if (value === null) return '';
  if (!(value instanceof Date)) return String(value);
  const iso = value.toISOString();
  return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;
}

/** The encoded channels of each group, dropping a group whose fields an earlier column already shows. */
function columnSources(
  encoding: Encoding,
  groups: ReadonlyArray<ReadonlyArray<keyof Encoding>>,
): ColumnSource[] {
  const shown = new Set<string>();
  return groups.flatMap((group) => {
    const source = group.flatMap((name) => {
      const channel = encoding[name];
      return channel === undefined ? [] : [[name, channel] as const];
    });
    const fields = source.map(([, channel]) => channel.field);
    if (source.length === 0 || fields.every((field) => shown.has(field))) return [];
    fields.forEach((field) => shown.add(field));
    return [source];
  });
}

/** A `tree`'s labels by id, so its parent column names each parent as its own row does; empty without a `label` channel. */
function parentLabels(
  spec: ChartSpec | UnsupportedMarkSpec,
  rows: DataRows,
): ReadonlyMap<string, string> {
  const { id, label } = spec.encoding;
  if (spec.mark !== 'tree' || id === undefined || label === undefined) return new Map();
  const idOf = makeAccessor(id);
  const labelOf = makeAccessor(label);
  return new Map(rows.map((datum) => [formatValue(idOf(datum)), formatValue(labelOf(datum))]));
}

/**
 * Builds a chart's data table from its spec and resolved rows: one column
 * per encoded channel (a range's `x` / `x2` or `y` / `y2` as one column,
 * "start to end"; a channel repeating an earlier column's field is left
 * out), one row per datum. A `tree` lists each node with its parent, by
 * label where the spec has a `label` channel. Pure and DOM-free; it takes an
 * `UnsupportedMarkSpec` too, which is what the fallback renders.
 *
 * @throws {TypeError} when a datum value contradicts its channel's declared type.
 */
export function buildDataTable(
  spec: ChartSpec | UnsupportedMarkSpec,
  rows: DataRows,
  options?: DataTableOptions,
): DataTable {
  const separator = options?.rangeSeparator ?? DEFAULT_RANGE_SEPARATOR;
  const sources = columnSources(
    spec.encoding,
    spec.mark === 'tree' ? treeGroups(spec.encoding) : CHANNEL_GROUPS,
  );
  const labels = parentLabels(spec, rows);
  const readers = sources.map((source) =>
    source.map(([name, channel]) => {
      const read = makeAccessor(channel);
      if (name !== 'parent' || labels.size === 0) return (datum: Datum) => formatValue(read(datum));
      return (datum: Datum) => {
        const parent = formatValue(read(datum));
        return labels.get(parent) ?? parent;
      };
    }),
  );
  return {
    caption: spec.config?.title,
    columns: sources.map((source) => ({
      channels: source.map(([name]) => name),
      header: source.map(([, channel]) => channel.field).join(separator),
    })),
    rows: rows.map((datum) =>
      readers.map((cell) =>
        cell
          .map((read) => read(datum))
          .filter((text) => text.length > 0)
          .join(separator),
      ),
    ),
  };
}
