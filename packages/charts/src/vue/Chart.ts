import { resolveChart, type DataRows, type Margins } from '../core/index.ts';
import type { ChartSpec } from '../spec/index.ts';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';
import { renderAxes, renderMarks, renderTreeOutline } from './render.ts';

const TITLE_COLOR = '#111827';
const FONT_FAMILY = 'system-ui, sans-serif';

/**
 * Renders a portable chart spec as SVG.
 *
 * Pure rendering: geometry is computed via the `/core` entry in a computed ref and
 * emitted as SVG vnodes, so the component works identically with Vue SSR
 * (`@vue/server-renderer`) and on the client. The SVG uses a viewBox, so it
 * scales to its container with CSS.
 */
export const Chart = defineComponent({
  name: 'Chart',
  props: {
    /** The portable chart spec. Runtime-validated, since specs come from documents. */
    spec: { type: Object as PropType<ChartSpec>, required: true },
    /** Resolved data rows. Required when the spec's data is a reference. */
    data: { type: Array as PropType<DataRows>, default: undefined },
    /** Outer width in pixels (the SVG scales to its container via viewBox). */
    width: { type: Number, default: 640 },
    /** Outer height in pixels. */
    height: { type: Number, default: 360 },
    /** Margin overrides. */
    margins: { type: Object as PropType<Partial<Margins>>, default: undefined },
  },
  setup(props, { slots }) {
    const state = computed(() =>
      resolveChart(props.spec, { width: props.width, height: props.height }, props.data, {
        margins: props.margins,
      }),
    );

    return () => {
      const current = state.value;

      if (current.kind === 'error') {
        // The `fallback` slot receives the message; default to an alert div.
        return (
          slots['fallback']?.({ message: current.message }) ??
          h('div', { role: 'alert', 'data-chart-error': '' }, current.message)
        );
      }

      const { dimensions } = current.context;
      const title = current.spec.config?.title;
      const children: VNode[] = [];

      if (title) {
        children.push(
          h(
            'text',
            {
              x: dimensions.outer.width / 2,
              y: dimensions.margins.top / 2,
              'text-anchor': 'middle',
              'dominant-baseline': 'middle',
              'font-family': FONT_FAMILY,
              'font-size': 14,
              'font-weight': 600,
              fill: TITLE_COLOR,
            },
            title,
          ),
        );
      }

      children.push(
        h('g', { transform: `translate(${dimensions.margins.left},${dimensions.margins.top})` }, [
          ...(current.context.geometry.mark === 'tree'
            ? []
            : [renderAxes(current.context.ticks, dimensions.plot)]),
          renderMarks(current.context.geometry),
        ]),
      );

      const svg = h(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: `0 0 ${dimensions.outer.width} ${dimensions.outer.height}`,
          role: 'img',
          'aria-label': title,
        },
        children,
      );
      // A tree's children are presentational inside role="img", so its text
      // alternative (the nested outline) is a sibling of the SVG.
      const geometry = current.context.geometry;
      return geometry.mark === 'tree' ? [svg, renderTreeOutline(geometry)] : svg;
    };
  },
});
