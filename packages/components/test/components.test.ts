import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Button from '../src/lib/components/Button.svelte';
import Card from '../src/lib/components/Card.svelte';
import Select from '../src/lib/components/Select.svelte';

describe('server rendering', () => {
  it('renders a button with the default variant and size', () => {
    const { body } = render(Button);

    expect(body).toContain('<button');
    expect(body).toContain('bg-slate-900');
    expect(body).toContain('h-10 px-4 py-2');
    expect(body).toContain('type="button"');
  });

  it('applies the requested variant and size', () => {
    const { body } = render(Button, { props: { variant: 'outline', size: 'lg' } });

    expect(body).toContain('border-slate-300');
    expect(body).toContain('h-12 px-8 text-lg');
    expect(body).not.toContain('bg-slate-900');
  });

  it('appends the consumer class after its own so it wins', () => {
    const { body } = render(Button, { props: { class: 'bg-purple-500' } });
    const base = body.indexOf('bg-slate-900');
    const override = body.indexOf('bg-purple-500');

    expect(base).toBeGreaterThanOrEqual(0);
    expect(override).toBeGreaterThan(base);
  });

  it('forwards unknown attributes to the underlying element', () => {
    const { body } = render(Button, { props: { 'aria-label': 'Save', disabled: true } });

    expect(body).toContain('aria-label="Save"');
    expect(body).toContain('disabled');
  });

  it('renders a card as a div with its base classes', () => {
    const { body } = render(Card);

    expect(body).toContain('<div');
    expect(body).toContain('rounded-lg border border-slate-200 bg-white shadow-sm');
  });

  it('renders every select option, marking disabled ones', () => {
    const { body } = render(Select, {
      props: {
        items: [
          { value: 'apple', label: 'Apple' },
          { value: 'grape', label: 'Grape', disabled: true },
        ],
      },
    });

    expect(body).toContain('data-label="Apple"');
    expect(body).toContain('data-label="Grape"');
    expect(body).toContain('aria-disabled="true"');
  });

  it('shows the placeholder when nothing is selected', () => {
    const { body } = render(Select, {
      props: { items: [{ value: 'apple', label: 'Apple' }], placeholder: 'Pick one' },
    });

    expect(body).toContain('Pick one');
  });

  it('shows the selected item label rather than the placeholder', () => {
    const { body } = render(Select, {
      props: {
        items: [{ value: 'apple', label: 'Apple' }],
        value: 'apple',
        placeholder: 'Pick one',
      },
    });

    expect(body).toContain('Apple');
    expect(body).not.toContain('Pick one');
  });
});
