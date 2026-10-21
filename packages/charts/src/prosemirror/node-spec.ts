import { encodeSpec, validateSpec, type ChartSpec } from '../spec/index.ts';
import type { NodeSpec } from 'prosemirror-model';

/** The canonical name for the chart node in a ProseMirror schema. */
export const CHART_NODE_NAME = 'chart';

/** The DOM attribute carrying the serialised spec. */
export const CHART_SPEC_ATTRIBUTE = 'data-chart-spec';

/** Options for {@link createChartNodeSpec}. */
export interface ChartNodeSpecOptions {
  /** The node group. Defaults to 'block'. */
  readonly group?: string;
  /** Extra class for the rendered DOM element. */
  readonly className?: string;
}

/** The attrs shape of a chart node. */
export interface ChartNodeAttrs {
  /** The portable chart spec, or null for an empty/placeholder chart. */
  readonly spec: ChartSpec | null;
}

/**
 * Creates the ProseMirror NodeSpec for a chart node.
 *
 * The chart is an atom (leaf) node whose only attr is the portable chart
 * spec — pure JSON, so document persistence (toJSON / fromJSON) carries the
 * spec with zero extra work. DOM serialisation stores the spec JSON in a
 * data attribute so copy/paste and HTML round-trips preserve it too.
 */
export function createChartNodeSpec(options?: ChartNodeSpecOptions): NodeSpec {
  const className = options?.className ?? 'chart-node';

  return {
    group: options?.group ?? 'block',
    atom: true,
    // Charts are self-contained data; they have no editable text content.
    selectable: true,
    draggable: true,
    attrs: {
      spec: { default: null },
    },
    parseDOM: [
      {
        tag: `div[${CHART_SPEC_ATTRIBUTE}]`,
        getAttrs: (dom) => {
          const raw = dom.getAttribute(CHART_SPEC_ATTRIBUTE);
          if (!raw) return { spec: null };
          const parsed = parseJson(raw);
          if (parsed === undefined) return false;
          const result = validateSpec(parsed);
          // An unparseable spec is not a chart node; let other rules try.
          return result.ok ? { spec: result.value } : false;
        },
      },
    ],
    toDOM: (node) => {
      const attrs = node.attrs as ChartNodeAttrs;
      return [
        'div',
        {
          class: className,
          [CHART_SPEC_ATTRIBUTE]: attrs.spec ? JSON.stringify(encodeSpec(attrs.spec)) : '',
        },
      ];
    },
  };
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
