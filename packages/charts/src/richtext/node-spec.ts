import { encodeSpec, validateSpec, type ChartSpec } from '../spec/index.ts';
import type { Attrs, NodeSpec } from '@thomasfosterau/effect-richtext/Model';

/** The canonical name for the chart node in an effect-richtext schema. */
export const CHART_NODE_NAME = 'chart';

/** The DOM attribute carrying the serialised spec. */
export const CHART_SPEC_ATTRIBUTE = 'data-chart-spec';

/** Options for {@link createChartNodeSpec}. */
export interface ChartNodeSpecOptions {
  /**
   * The node group.
   * @defaultValue 'block'
   */
  readonly group?: string | undefined;
  /**
   * Class of the serialised `<div>`.
   * @defaultValue 'chart-node'
   */
  readonly className?: string | undefined;
}

/** The attrs shape of a chart node. */
export interface ChartNodeAttrs {
  /** The portable chart spec, or null for an empty/placeholder chart. */
  readonly spec: ChartSpec | null;
}

/**
 * The NodeSpec {@link createChartNodeSpec} returns. It declares its one
 * attr, so a schema built from it knows a chart node has `attrs.spec`.
 * That value is `unknown` until validated: it may come from a peer or a
 * pasted document.
 */
export interface ChartNodeSpec extends NodeSpec {
  readonly attrs: { readonly spec: { readonly default: null } };
}

/** The chart attrs of a node's `attrs`, which an untyped schema types as `any` values. */
export function chartNodeAttrs(attrs: Attrs): ChartNodeAttrs {
  const spec: ChartSpec | null = attrs['spec'];
  return { spec };
}

/**
 * Creates the effect-richtext NodeSpec for a chart node.
 *
 * The chart is an atom (leaf) node whose only attr is the portable chart
 * spec — pure JSON, so document persistence (toJSON / fromJSON) carries the
 * spec with zero extra work. DOM serialisation stores the spec JSON in a
 * data attribute so copy/paste and HTML round-trips preserve it too.
 *
 * `toDOM` writes `<div class="chart-node" data-chart-spec="…">` with the
 * encoded spec JSON (empty for a `null` spec). `parseDOM` reads it back and
 * validates it: an invalid spec does not match the rule, leaving other rules
 * to try. Nor does a newer `1.N` spec, since its parsed value drops what this
 * version does not know and storing that would rewrite the document. The node
 * is selectable and draggable.
 */
export function createChartNodeSpec(options?: ChartNodeSpecOptions): ChartNodeSpec {
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
          // Nor is a newer 1.N one: its parsed value drops what this
          // version does not know, and storing it would rewrite the
          // document on paste.
          return result.ok && result.degradation === undefined ? { spec: result.value } : false;
        },
      },
    ],
    toDOM: (node) => {
      const attrs = chartNodeAttrs(node.attrs);
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
