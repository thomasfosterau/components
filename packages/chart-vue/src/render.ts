/**
 * SVG render-function helpers shared by the Chart component.
 *
 * Written as plain `h()` render functions (not SFCs) so the package needs no
 * Vue compiler step: it is plain TypeScript that any Vue 3 app — bundled,
 * SSR, or CDN — can consume.
 */
import {
  CATEGORICAL_PALETTE,
  type Box,
  type ChartTicks,
  type Geometry,
} from '@thomasfosterau/chart-core';
import { h, type VNode } from 'vue';

const DEFAULT_COLOR = CATEGORICAL_PALETTE[0]!;
const AXIS_COLOR = '#9ca3af';
const LABEL_COLOR = '#4b5563';
const FONT_FAMILY = 'system-ui, sans-serif';

/** Renders chart geometry as SVG vnodes, switching on the mark. */
export function renderMarks(geometry: Geometry): VNode {
  switch (geometry.mark) {
    case 'line':
      return h(
        'g',
        { 'data-mark': 'line' },
        geometry.series
          .filter((series) => series.path.length > 0)
          .map((series) =>
            h('path', {
              key: series.key ?? '',
              d: series.path,
              fill: 'none',
              stroke: series.color ?? DEFAULT_COLOR,
              'stroke-width': 2,
            }),
          ),
      );
    case 'area':
      return h(
        'g',
        { 'data-mark': 'area' },
        geometry.series
          .filter((series) => series.path.length > 0)
          .map((series) =>
            h('path', {
              key: series.key ?? '',
              d: series.path,
              fill: series.color ?? DEFAULT_COLOR,
              'fill-opacity': 0.7,
              stroke: 'none',
            }),
          ),
      );
    case 'bar':
      return h(
        'g',
        { 'data-mark': 'bar' },
        geometry.bars.map((bar, index) =>
          h('rect', {
            key: index,
            x: bar.x,
            y: bar.y,
            width: bar.width,
            height: bar.height,
            fill: bar.color ?? DEFAULT_COLOR,
          }),
        ),
      );
    case 'point':
      return h(
        'g',
        { 'data-mark': 'point' },
        geometry.points.map((point, index) =>
          h('circle', {
            key: index,
            cx: point.cx,
            cy: point.cy,
            r: point.r,
            fill: point.color ?? DEFAULT_COLOR,
          }),
        ),
      );
  }
}

/** Renders x/y axes with tick marks and labels. */
export function renderAxes(ticks: ChartTicks, plot: Box): VNode {
  return h('g', { 'data-axes': '' }, [
    h('line', { x1: 0, y1: plot.height, x2: plot.width, y2: plot.height, stroke: AXIS_COLOR }),
    h('line', { x1: 0, y1: 0, x2: 0, y2: plot.height, stroke: AXIS_COLOR }),
    ...(ticks.x ?? []).map((tick, index) =>
      h('g', { key: `x-${index}`, transform: `translate(${tick.position},${plot.height})` }, [
        h('line', { y2: 6, stroke: AXIS_COLOR }),
        h(
          'text',
          {
            y: 18,
            'text-anchor': 'middle',
            'font-family': FONT_FAMILY,
            'font-size': 11,
            fill: LABEL_COLOR,
          },
          tick.label,
        ),
      ]),
    ),
    ...(ticks.y ?? []).map((tick, index) =>
      h('g', { key: `y-${index}`, transform: `translate(0,${tick.position})` }, [
        h('line', { x2: -6, stroke: AXIS_COLOR }),
        h(
          'text',
          {
            x: -10,
            'text-anchor': 'end',
            'dominant-baseline': 'middle',
            'font-family': FONT_FAMILY,
            'font-size': 11,
            fill: LABEL_COLOR,
          },
          tick.label,
        ),
      ]),
    ),
  ]);
}
