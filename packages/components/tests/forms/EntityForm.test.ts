import { describe, expect, it } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import EntityForm from '../../src/lib/forms/EntityForm.svelte';
import { thingForm } from './fixtures/entity-form-definitions.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const hiddenId = (container: HTMLElement): string | null =>
  container.querySelector<HTMLInputElement>('input[type="hidden"][name="id"]')?.value ?? null;

describe('create mode', () => {
  it('renders every create entry in declaration order, labelled by its message thunk', async () => {
    const screen = await render(EntityForm, { definition: thingForm, mode: 'create' });
    const names = Array.from(screen.container.querySelectorAll('[name]'), (el) =>
      el.getAttribute('name'),
    ).filter((name) => name !== 'id');
    expect(names).toEqual([
      'title',
      'parentId',
      'note',
      'summary',
      'published',
      'pages',
      'status',
      'rows',
    ]);
    await expect.element(screen.getByRole('textbox', { name: /Title/ })).toBeRequired();
    await expect
      .element(screen.getByRole('textbox', { name: 'Note' }))
      .toHaveAttribute('placeholder', 'Anything else');
  });

  it('mints a client id once per mount', async () => {
    const screen = await render(EntityForm, { definition: thingForm, mode: 'create' });
    expect(hiddenId(screen.container)).toMatch(UUID);
  });

  it('picks the control from the entry: textarea, date, numeric text, select', async () => {
    const screen = await render(EntityForm, { definition: thingForm, mode: 'create' });
    const { container } = screen;
    expect(container.querySelector('textarea[name="summary"]')).not.toBeNull();
    expect(container.querySelector('input[name="published"]')).toHaveAttribute('type', 'date');
    expect(container.querySelector('input[name="pages"]')).toHaveAttribute('inputmode', 'numeric');
    const status = screen.getByRole('combobox', { name: /Status/ });
    await expect.element(status).toBeInTheDocument();
    const options = Array.from(container.querySelectorAll('select[name="status"] option'), (o) =>
      o.textContent?.trim(),
    );
    expect(options).toEqual(['Choose…', 'Draft', 'Published']);
  });

  it('seeds a create form from initial (a pre-filled FK)', async () => {
    const screen = await render(EntityForm, {
      definition: thingForm,
      mode: 'create',
      initial: { parentId: 'b' },
    });
    await expect.element(screen.getByRole('combobox', { name: 'Parent' })).toHaveValue('b');
  });

  it('gates submit while a gated widget is empty, and ungates when it is filled', async () => {
    const screen = await render(EntityForm, { definition: thingForm, mode: 'create' });
    const submit = screen.getByRole('button', { name: 'Create thing' });
    await expect.element(submit).toBeDisabled();
    await screen.getByRole('combobox', { name: 'Parent' }).selectOptions('a');
    await expect.element(submit).toBeEnabled();
  });

  it('bridges a rows widget to row state held by the renderer', async () => {
    const screen = await render(EntityForm, {
      definition: thingForm,
      mode: 'create',
      initialRows: { rows: [{ agentId: 'a', orderingPosition: 0 }] },
    });
    await expect.element(screen.getByText('1 rows')).toBeInTheDocument();
    await screen.getByRole('button', { name: 'Add row' }).click();
    await expect.element(screen.getByText('2 rows')).toBeInTheDocument();
  });

  it('spreads fieldProps into a widget, but never over the bridge', async () => {
    const screen = await render(EntityForm, {
      definition: thingForm,
      mode: 'create',
      initial: { parentId: 'a' },
      fieldProps: { parentId: { hint: 'Pick one', name: 'hijacked', value: 'b' } },
    });
    await expect.element(screen.getByText('Pick one')).toBeInTheDocument();
    const picker = screen.getByRole('combobox', { name: 'Parent' });
    await expect.element(picker).toHaveAttribute('name', 'parentId');
    await expect.element(picker).toHaveValue('a');
  });
});

describe('update mode', () => {
  const id = '0b54f5a1-6f2d-4f4e-9a0f-2f63c1f6a111';

  it('seeds every field from initial before first render, and posts the id', async () => {
    const screen = await render(EntityForm, {
      definition: thingForm,
      mode: 'update',
      initial: { id, title: 'Existing', parentId: 'a', status: 'published' },
    });
    await expect.element(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('Existing');
    await expect.element(screen.getByRole('combobox', { name: /Status/ })).toHaveValue('published');
    expect(hiddenId(screen.container)).toBe(id);
    await expect.element(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });
});

describe('the form element', () => {
  it('posts, to a named action when given', async () => {
    const screen = await render(EntityForm, {
      definition: thingForm,
      mode: 'create',
      action: '?/addItem',
    });
    const form = screen.container.querySelector('form');
    expect(form?.getAttribute('method')).toBe('post');
    expect(form?.getAttribute('action')).toBe('?/addItem');
  });

  it("takes the caller's enhance for the form attributes", async () => {
    const screen = await render(EntityForm, {
      definition: thingForm,
      mode: 'create',
      enhance: () => ({ method: 'post', 'data-enhanced': 'kit' }),
    });
    expect(screen.container.querySelector('form')?.getAttribute('data-enhanced')).toBe('kit');
  });

  it('renders a cancel link with its label as a prop', async () => {
    const screen = await render(EntityForm, {
      definition: thingForm,
      mode: 'create',
      cancelHref: '/things',
      cancelLabel: 'Cancelar',
    });
    await expect
      .element(screen.getByRole('link', { name: 'Cancelar' }))
      .toHaveAttribute('href', '/things');
  });
});

describe('form-level messages', () => {
  it('renders no alert when there is nothing to say', async () => {
    const screen = await render(EntityForm, { definition: thingForm, mode: 'create' });
    expect(screen.getByRole('alert').elements()).toHaveLength(0);
  });

  it("renders the caller's messages as one alert each, in order, before the fields", async () => {
    const screen = await render(EntityForm, {
      definition: thingForm,
      mode: 'create',
      messages: ['The server could not save this.', 'Try again in a minute.'],
    });
    const alerts = screen.getByRole('alert').elements();
    expect(alerts.map((alert) => alert.textContent?.trim())).toEqual([
      'The server could not save this.',
      'Try again in a minute.',
    ]);
    // A failed submit is announced where the reader starts reading the form.
    const firstField = screen.container.querySelector('[name="title"]');
    expect(firstField).not.toBeNull();
    for (const alert of alerts) {
      expect(alert.compareDocumentPosition(firstField!) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }
  });
});
