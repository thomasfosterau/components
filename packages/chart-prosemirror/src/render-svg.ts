import { CATEGORICAL_PALETTE, type ChartContext, type Tick } from '@thomasfosterau/chart-core';

/** Options for SVG rendering. */
export interface RenderSvgOptions {
  /** Chart title rendered above the plot. */
  readonly title?: string | undefined;
  /** Class attribute for the root <svg> element. */
  readonly className?: string | undefined;
}

const AXIS_COLOR = '#9ca3af';
const LABEL_COLOR = '#4b5563';
const TITLE_COLOR = '#111827';
const FONT = 'font-family="system-ui, sans-serif"';
const DEFAULT_COLOR = CATEGORICAL_PALETTE[0]!;

/**
 * Renders a computed ChartContext to an SVG string.
 *
 * Pure string building — no DOM required — so it works in the ProseMirror
 * NodeView (via innerHTML), in server-side rendering, and in headless tests.
 * The SVG uses a viewBox so it scales to its container via CSS.
 */
export function renderContextToSvg(context: ChartContext, options?: RenderSvgOptions): string {
  const { outer, margins } = context.dimensions;
  const parts: string[] = [];

  const classAttr = options?.className ? ` class="${escapeXml(options.className)}"` : '';
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${outer.width} ${outer.height}"${classAttr} role="img">`,
  );

  if (options?.title) {
    parts.push(
      `<text x="${outer.width / 2}" y="${margins.top / 2}" text-anchor="middle" dominant-baseline="middle" ` +
        `${FONT} font-size="14" font-weight="600" fill="${TITLE_COLOR}">${escapeXml(options.title)}</text>`,
    );
  }

  // Plot group: geometry and axes are in plot coordinates.
  parts.push(`<g transform="translate(${margins.left},${margins.top})">`);
  parts.push(renderAxes(context));
  parts.push(renderGeometry(context));
  parts.push('</g>');

  parts.push('</svg>');
  return parts.filter((part) => part.length > 0).join('');
}

function renderAxes(context: ChartContext): string {
  const { plot } = context.dimensions;
  const parts: string[] = [];

  // Axis lines.
  parts.push(
    `<line x1="0" y1="${plot.height}" x2="${plot.width}" y2="${plot.height}" stroke="${AXIS_COLOR}"/>`,
  );
  parts.push(`<line x1="0" y1="0" x2="0" y2="${plot.height}" stroke="${AXIS_COLOR}"/>`);

  // X ticks: below the plot.
  for (const tick of context.ticks.x ?? []) {
    parts.push(renderXTick(tick, plot.height));
  }
  // Y ticks: left of the plot.
  for (const tick of context.ticks.y ?? []) {
    parts.push(renderYTick(tick));
  }

  return parts.join('');
}

function renderXTick(tick: Tick, plotHeight: number): string {
  return (
    `<g transform="translate(${tick.position},${plotHeight})">` +
    `<line y2="6" stroke="${AXIS_COLOR}"/>` +
    `<text y="18" text-anchor="middle" ${FONT} font-size="11" fill="${LABEL_COLOR}">${escapeXml(tick.label)}</text>` +
    '</g>'
  );
}

function renderYTick(tick: Tick): string {
  return (
    `<g transform="translate(0,${tick.position})">` +
    `<line x2="-6" stroke="${AXIS_COLOR}"/>` +
    `<text x="-10" text-anchor="end" dominant-baseline="middle" ${FONT} font-size="11" fill="${LABEL_COLOR}">${escapeXml(tick.label)}</text>` +
    '</g>'
  );
}

function renderGeometry(context: ChartContext): string {
  const geometry = context.geometry;
  switch (geometry.mark) {
    case 'line':
      return geometry.series
        .filter((series) => series.path.length > 0)
        .map(
          (series) =>
            `<path d="${series.path}" fill="none" stroke="${series.color ?? DEFAULT_COLOR}" stroke-width="2"/>`,
        )
        .join('');
    case 'area':
      return geometry.series
        .filter((series) => series.path.length > 0)
        .map(
          (series) =>
            `<path d="${series.path}" fill="${series.color ?? DEFAULT_COLOR}" fill-opacity="0.7" stroke="none"/>`,
        )
        .join('');
    case 'bar':
      return geometry.bars
        .map(
          (bar) =>
            `<rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" fill="${bar.color ?? DEFAULT_COLOR}"/>`,
        )
        .join('');
    case 'point':
      return geometry.points
        .map(
          (point) =>
            `<circle cx="${point.cx}" cy="${point.cy}" r="${point.r}" fill="${point.color ?? DEFAULT_COLOR}"/>`,
        )
        .join('');
  }
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
