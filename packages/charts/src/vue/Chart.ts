import { computeContext, type ChartContext, type DataRows, type Margins } from '../core/index.ts';
import { isDataRef, validateSpec, type ChartSpec } from '../spec/index.ts';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';
import { renderAxes, renderMarks } from './render.ts';

const TITLE_COLOR = '#111827';
const FONT_FAMILY = 'system-ui, sans-serif';

type ChartState =
  | { readonly kind: 'ready'; readonly spec: ChartSpec; readonly context: ChartContext }
  | { readonly kind: 'error'; readonly message: string };

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
    const state = computed<ChartState>(() => {
      const validation = validateSpec(props.spec);
      if (!validation.ok) {
        return { kind: 'error', message: `Invalid chart spec: ${validation.errors[0] ?? ''}` };
      }
      if (isDataRef(validation.value.data) && !props.data) {
        return {
          kind: 'error',
          message: 'Chart data is stored externally; pass resolved rows via the data prop',
        };
      }
      try {
        return {
          kind: 'ready',
          spec: validation.value,
          context: computeContext(
            validation.value,
            { width: props.width, height: props.height },
            props.data,
            props.margins ? { margins: props.margins } : undefined,
          ),
        };
      } catch (error) {
        return {
          kind: 'error',
          message: error instanceof Error ? error.message : 'Failed to compute chart',
        };
      }
    });

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
          renderAxes(current.context.ticks, dimensions.plot),
          renderMarks(current.context.geometry),
        ]),
      );

      return h(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: `0 0 ${dimensions.outer.width} ${dimensions.outer.height}`,
          role: 'img',
          'aria-label': title,
        },
        children,
      );
    };
  },
});
