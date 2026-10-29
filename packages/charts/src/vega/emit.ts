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

/** Thrown when a spec cannot be represented in Vega-Lite. */
export class VegaLiteEmitError extends Error {
  override readonly name = 'VegaLiteEmitError';
}

/**
 * Emits a Vega-Lite specification from a portable chart spec.
 *
 * This is the escape hatch / SSR fallback interpreter, and doubles as the
 * proof that the portable spec is genuinely Vega-Lite-shaped: marks and
 * typed encodings translate one-to-one.
 *
 * Web-only `extensions` are ignored, per the capability matrix.
 */
export function emitVegaLite(spec: ChartSpec, options?: EmitVegaLiteOptions): VegaLiteSpec {
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
  if (rows) return { values: rows as ReadonlyArray<Record<string, unknown>> };

  if (isInlineData(spec.data)) {
    return { values: spec.data.values as ReadonlyArray<Record<string, unknown>> };
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
