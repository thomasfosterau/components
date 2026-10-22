// @vitest-environment happy-dom
/**
 * Client-side tests: mounting, prop reactivity.
 */
import { parseSpec } from '../../src/spec/index.ts';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { createApp, h, nextTick, reactive, type App, type Component } from 'vue';
import { Chart } from '../../src/vue/index.ts';

const pointSpec = parseSpec({
  specVersion: '1',
  mark: 'point',
  encoding: {
    x: { field: 'x', type: 'quantitative' },
    y: { field: 'y', type: 'quantitative' },
  },
  data: {
    values: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
  },
});

let app: App | undefined;
let container: HTMLElement | undefined;

afterEach(() => {
  app?.unmount();
  container?.remove();
  app = undefined;
  container = undefined;
});

function mount(props: Record<string, unknown>): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  app = createApp({ render: () => h(Chart as Component, props) });
  app.mount(container);
  return container;
}

describe('Chart client rendering', () => {
  it('mounts and renders SVG circles', () => {
    const target = mount({ spec: pointSpec });
    expect(target.querySelector('svg')).toBeTruthy();
    expect(target.querySelectorAll('circle')).toHaveLength(2);
  });

  it('re-renders reactively when props change', async () => {
    const props = reactive({ spec: pointSpec });
    const target = mount(props);
    expect(target.querySelectorAll('circle')).toHaveLength(2);

    props.spec = parseSpec({
      ...pointSpec,
      data: {
        values: [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
          { x: 10, y: 10 },
        ],
      },
    });
    await nextTick();
    expect(target.querySelectorAll('circle')).toHaveLength(3);
  });

  it('switches from fallback to chart when data arrives', async () => {
    const refSpec = parseSpec({
      specVersion: '1',
      mark: 'bar',
      encoding: {
        x: { field: 'cat', type: 'nominal' },
        y: { field: 'v', type: 'quantitative' },
      },
      data: { ref: { kind: 'query', id: 'sales' } },
    });
    const props = reactive<{ spec: typeof refSpec; data?: ReadonlyArray<Record<string, never>> }>({
      spec: refSpec,
    });
    const target = mount(props);
    expect(target.textContent).toContain('stored externally');

    Object.assign(props, { data: [{ cat: 'a', v: 1 }] });
    await nextTick();
    expect(target.querySelectorAll('rect')).toHaveLength(1);
  });
});
