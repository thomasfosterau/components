import {
  isDataRef,
  isInlineData,
  type ChartSpec,
  type Channel,
  type Datum,
  type ScaleHint,
} from '../spec/index.ts';
import type { VegaLiteData, VegaLiteEncoding, VegaLiteFieldDef, VegaLiteSpec } from './types.ts';

/** The Vega-Lite schema the emitter targets. */
export const VEGA_LITE_SCHEMA = 'https://vega.github.io/schema/vega-lite/v6.json';

/** Whether `mark` translates one-to-one to a Vega-Lite mark. */
function isVegaLiteMark(mark: string): boolean {
  switch (mark) {
    case 'bar':
    case 'line':
    case 'point':
    case 'area':
      return true;
    default:
      return false;
  }
}

/** Options for {@link emitVegaLite}. */
export interface EmitVegaLiteOptions {
  /**
   * Resolved data rows for specs whose data is a `query` or `node` reference.
   * Vega-Lite has no concept of host data references, so the host must
   * pre-resolve them (see the capability matrix).
   */
  readonly rows?: ReadonlyArray<Datum> | undefined;
  /** Chart width. Defaults to 'container' (responsive). */
  readonly width?: number | 'container' | undefined;
  /** Chart height in pixels. */
  readonly height?: number | undefined;
}

/** Why a spec could not be emitted: a mark Vega-Lite has no equivalent for, or data the host must resolve. */
export type VegaLiteEmitErrorReason = 'unsupported-mark' | 'unresolved-data';

/**
 * Thrown when a spec cannot be represented in Vega-Lite. `reason` says
 * which way, so a host can fall back without parsing the message: on
 * `'unsupported-mark'` (the `tree` mark, ⛔ in the capability matrix) render
 * the spec with a TS interpreter instead, which also carries the
 * nested-list text alternative.
 */
export class VegaLiteEmitError extends Error {
  override readonly name = 'VegaLiteEmitError';
  readonly reason: VegaLiteEmitErrorReason;

  constructor(message: string, reason: VegaLiteEmitErrorReason = 'unresolved-data') {
    super(message);
    this.reason = reason;
  }
}

/**
 * Emits a Vega-Lite specification from a portable chart spec.
 *
 * This is the escape hatch / SSR fallback interpreter, and doubles as the
 * proof that the portable spec is genuinely Vega-Lite-shaped: marks and
 * typed encodings translate one-to-one. `config.title` becomes `title`,
 * `config.tooltip` becomes `mark.tooltip`, and `scales.x` / `scales.y` become
 * the x and y `scale` (`domain`, `nice`, `zero`). Data comes from
 * `options.rows` if given, else inline `values`, else a `url` ref's `id` as
 * `url`. The test suite compiles every emitted spec with the real Vega-Lite
 * compiler.
 *
 * Web-only `extensions` are ignored, per the capability matrix.
 *
 * A newer `1.N` document reaches it already degraded: `parseSpec` has
 * dropped what this version does not know, so the emitted spec is the
 * known subset. A newer mark never becomes a `ChartSpec` (`validateSpec`
 * returns it as `unsupported`; render it with a TS interpreter's data-table
 * fallback); one forced through a cast throws, as the `tree` mark does.
 *
 * @throws {VegaLiteEmitError} with reason `'unsupported-mark'` for a `tree` or unknown mark, `'unresolved-data'` for a `query` / `node` ref without `rows`.
 */
export function emitVegaLite(spec: ChartSpec, options?: EmitVegaLiteOptions): VegaLiteSpec {
  if (spec.mark === 'tree') {
    throw new VegaLiteEmitError(
      'Vega-Lite has no tree layout (that is full Vega); render a "tree" spec with a TS interpreter',
      'unsupported-mark',
    );
  }
  if (!isVegaLiteMark(spec.mark)) {
    throw new VegaLiteEmitError(
      `Mark "${spec.mark}" is not one this emitter knows; render the spec with a TS interpreter`,
      'unsupported-mark',
    );
  }
  return {
    $schema: VEGA_LITE_SCHEMA,
    ...(spec.config?.title !== undefined ? { title: spec.config.title } : {}),
    mark: {
      type: spec.mark,
      ...(spec.config?.tooltip !== undefined ? { tooltip: spec.config.tooltip } : {}),
    },
    data: emitData(spec, options?.rows),
    encoding: emitEncoding(spec),
    width: options?.width ?? 'container',
    ...(options?.height !== undefined ? { height: options.height } : {}),
  };
}

function emitData(spec: ChartSpec, rows?: ReadonlyArray<Datum>): VegaLiteData {
  // Pre-resolved rows always win: they are what the chart should show.
  if (rows) return { values: rows };

  if (isInlineData(spec.data)) {
    return { values: spec.data.values };
  }

  if (isDataRef(spec.data) && spec.data.ref.kind === 'url') {
    return { url: spec.data.ref.id };
  }

  throw new VegaLiteEmitError(
    `Vega-Lite cannot resolve ${spec.data.ref.kind} data references; ` +
      'the host must resolve the data and pass rows via options.rows',
  );
}

function emitEncoding(spec: ChartSpec): VegaLiteEncoding {
  return {
    ...emitChannel('x', spec.encoding.x, spec.scales?.x),
    ...emitChannel('y', spec.encoding.y, spec.scales?.y),
    // Range ends map straight across: Vega-Lite's x2 / y2 take the primary
    // channel's type and scale, so only the field is emitted.
    ...(spec.encoding.x2 ? { x2: { field: spec.encoding.x2.field } } : {}),
    ...(spec.encoding.y2 ? { y2: { field: spec.encoding.y2.field } } : {}),
    ...emitChannel('color', spec.encoding.color),
    ...emitChannel('size', spec.encoding.size),
    ...emitChannel('opacity', spec.encoding.opacity),
  };
}

function emitChannel(
  name: 'x' | 'y' | 'color' | 'size' | 'opacity',
  channel: Channel | undefined,
  hint?: ScaleHint,
): Partial<VegaLiteEncoding> {
  if (!channel) return {};

  const scale = emitScale(hint);
  const fieldDef: VegaLiteFieldDef = {
    field: channel.field,
    type: channel.type,
    ...(scale ? { scale } : {}),
  };
  return { [name]: fieldDef };
}

function emitScale(hint?: ScaleHint): VegaLiteFieldDef['scale'] | undefined {
  if (!hint) return undefined;
  const scale = {
    ...(hint.domain !== undefined ? { domain: hint.domain } : {}),
    ...(hint.nice !== undefined ? { nice: hint.nice } : {}),
    ...(hint.zero !== undefined ? { zero: hint.zero } : {}),
  };
  return Object.keys(scale).length > 0 ? scale : undefined;
}
