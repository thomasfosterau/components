// @vitest-environment happy-dom
/**
 * Client-side tests: mounting, hydration compatibility, and prop updates.
 */
import { parseSpec } from '../../src/spec/index.ts';
import { act } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { Chart } from '../../src/react/index.ts';

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

// React's act() environment flag.
(globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true;

let root: Root | undefined;
let container: HTMLElement | undefined;

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

function mount(element: React.ReactElement): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(element);
  });
  return container;
}

describe('Chart client rendering', () => {
  it('mounts and renders SVG circles', () => {
    const target = mount(<Chart spec={pointSpec} />);
    expect(target.querySelector('svg')).toBeTruthy();
    expect(target.querySelectorAll('circle')).toHaveLength(2);
  });

  it('re-renders when props change', () => {
    const target = mount(<Chart spec={pointSpec} />);
    expect(target.querySelectorAll('circle')).toHaveLength(2);

    const updated = parseSpec({
      ...pointSpec,
      data: {
        values: [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
          { x: 10, y: 10 },
        ],
      },
    });
    act(() => root!.render(<Chart spec={updated} />));
    expect(target.querySelectorAll('circle')).toHaveLength(3);
  });

  it('hydrates server-rendered markup without mismatch errors', () => {
    const element = <Chart spec={pointSpec} width={640} height={360} />;
    container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = renderToString(element);

    const errors: unknown[] = [];
    act(() => {
      root = hydrateRoot(container!, element, {
        onRecoverableError: (error) => errors.push(error),
      });
    });

    expect(errors).toHaveLength(0);
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });
});
