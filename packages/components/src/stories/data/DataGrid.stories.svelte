<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DataGrid from '../../lib/data/DataGrid.svelte';
  import type { CellChange, TableColumn } from '../../lib/data/table-types.ts';
  import Button from '../../lib/ui/Button.svelte';

  interface Device {
    readonly id: string;
    readonly name: string;
    readonly platform: string;
    readonly lastSeen: string;
    readonly sessions: number;
  }

  const platforms = ['macOS', 'iOS', 'Android', 'Linux', 'Windows'];

  const devices: readonly Device[] = Array.from({ length: 27 }, (_, index) => ({
    id: String(index + 1),
    name: `Device ${String(index + 1).padStart(2, '0')}`,
    platform: platforms[index % platforms.length] ?? 'Linux',
    lastSeen: `${(index % 28) + 1} Sep`,
    sessions: (index * 37) % 400,
  }));

  const columns: readonly TableColumn<Device>[] = [
    { key: 'name', header: 'Device', value: (device) => device.name, sortable: true },
    { key: 'platform', header: 'Platform', value: (device) => device.platform, sortable: true },
    { key: 'lastSeen', header: 'Last seen', value: (device) => device.lastSeen },
    {
      key: 'sessions',
      header: 'Sessions',
      value: (device) => device.sessions,
      sortable: true,
      align: 'end',
    },
  ];

  const rowKey = (device: Device): string => device.id;

  interface Product {
    readonly sku: string;
    readonly name: string;
    readonly price: number;
    readonly unit: string;
    readonly active: boolean;
  }

  const products: readonly Product[] = [
    { sku: 'A-100', name: 'Seed tray', price: 4.5, unit: 'each', active: true },
    { sku: 'A-101', name: 'Potting mix', price: 12, unit: 'bag', active: true },
    { sku: 'A-102', name: 'Twine', price: 3.25, unit: 'roll', active: false },
    { sku: 'A-103', name: 'Secateurs', price: 39, unit: 'each', active: true },
    { sku: 'A-104', name: 'Fleece', price: 8.75, unit: 'metre', active: true },
  ];

  const units = ['each', 'bag', 'roll', 'metre'];

  const notNegative = (value: unknown): readonly string[] =>
    typeof value === 'number' && value < 0 ? ['A price cannot be negative.'] : [];

  const productColumns: readonly TableColumn<Product>[] = [
    { key: 'name', header: 'Product', value: (product) => product.name, rowHeader: true },
    {
      key: 'price',
      header: 'Price',
      value: (product) => product.price,
      align: 'end',
      editable: true,
      editor: 'number',
      validate: notNegative,
      sortable: true,
    },
    {
      key: 'unit',
      header: 'Unit',
      value: (product) => product.unit,
      editable: true,
      editor: 'select',
      options: units,
    },
    {
      key: 'active',
      header: 'Listed',
      value: (product) => (product.active ? 'Yes' : 'No'),
      editValue: (product) => product.active,
      editable: true,
      editor: 'checkbox',
    },
  ];

  const productKey = (product: Product): string => product.sku;

  interface Contact {
    readonly line: string;
    readonly name: string;
    readonly email: string;
    readonly age: number;
  }

  // An import with problems the reader fixes in place before anything is saved (#139).
  const imported: readonly Contact[] = [
    { line: '2', name: 'Ada Lovelace', email: 'ada@example.org', age: 36 },
    { line: '3', name: '', email: 'grace@example', age: 85 },
    { line: '4', name: 'Alan Turing', email: 'alan@example.org', age: -41 },
    { line: '5', name: 'Katherine Johnson', email: 'katherine@example.org', age: 101 },
  ];

  const contactColumns: readonly TableColumn<Contact>[] = [
    { key: 'line', header: 'Line', value: (contact) => contact.line },
    {
      key: 'name',
      header: 'Name',
      value: (contact) => contact.name,
      editable: true,
      validate: (value) => (value === '' ? ['A name is required.'] : []),
    },
    {
      key: 'email',
      header: 'Email',
      value: (contact) => contact.email,
      editable: true,
      validate: (value) =>
        typeof value === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? [] : ['Not an email address.'],
    },
    {
      key: 'age',
      header: 'Age',
      value: (contact) => contact.age,
      align: 'end',
      editable: true,
      editor: 'number',
      validate: (value) => (typeof value === 'number' && value < 0 ? ['An age cannot be negative.'] : []),
    },
  ];

  const lineKey = (contact: Contact): string => contact.line;

  const givenNames = ['Ada', 'Grace', 'Alan', 'Katherine', 'Edsger', 'Barbara', 'Donald', 'Frances'];
  const familyNames = ['Lovelace', 'Hopper', 'Turing', 'Johnson', 'Dijkstra', 'Liskov', 'Knuth', 'Allen'];

  // A 5,000-row import generated here (no network), with a problem every
  // 750 lines so the error summary has distant rows to reach (#427).
  const pick = (list: readonly string[], index: number): string => list[index % list.length] ?? '';

  const largeImport: readonly Contact[] = Array.from({ length: 5000 }, (_, index) => {
    const given = pick(givenNames, index);
    const family = pick(familyNames, Math.floor(index / givenNames.length));
    const broken = index % 750 === 749;
    return {
      line: String(index + 2),
      name: index % 1500 === 1499 ? '' : `${given} ${family}`,
      email: broken ? `${given.toLowerCase()}@example` : `${given.toLowerCase()}.${index}@example.org`,
      age: 18 + ((index * 13) % 70),
    };
  });

  const patch = <T,>(row: T, change: CellChange<T>): T => ({ ...row, [change.column]: change.to });

  const { Story } = defineMeta({
    title: 'Data/DataGrid',
    component: DataGrid,
    parameters: {
      docs: {
        description: {
          component:
            'Sort, filter and page a bounded set the page already holds — entirely on the client. Every derivation runs over the whole `rows` array on every keystroke, so a collection the API pages belongs on `Table` + `PaginationFooter` instead, where the server does the work.',
        },
      },
    },
  });
</script>

<script lang="ts">
  let prices = $state<readonly Product[]>(products);
  let contacts = $state<readonly Contact[]>(imported);
  let pending = $state<CellChange<Contact>[]>([]);
  let bulk = $state<readonly Contact[]>(largeImport);
  let bulkPending = $state<CellChange<Contact>[]>([]);

  /** A pretend server: half a second, and it refuses any price over 100. */
  async function savePrice(change: CellChange<Product>, signal: AbortSignal): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (signal.aborted) return;
    if (typeof change.to === 'number' && change.to > 100) {
      throw new Error('Prices over 100 need a manager’s approval.');
    }
    prices = prices.map((product) => (product.sku === change.rowKey ? patch(product, change) : product));
  }

  function saveBatch(): void {
    contacts = contacts.map((contact) =>
      pending.reduce((row, change) => (change.rowKey === row.line ? patch(row, change) : row), contact),
    );
    pending = [];
  }

  function saveBulk(): void {
    const byLine = Map.groupBy(bulkPending, (change) => change.rowKey);
    bulk = bulk.map((contact) =>
      (byLine.get(contact.line) ?? []).reduce((row, change) => patch(row, change), contact),
    );
    bulkPending = [];
  }
</script>

<Story name="Filter, sort and page">
  <DataGrid rows={devices} {columns} {rowKey} filterable pageSize={5} caption="Your devices" />
</Story>

<Story name="Unpaged">
  <DataGrid
    rows={devices.slice(0, 6)}
    {columns}
    {rowKey}
    filterable
    paginated={false}
    caption="A short list"
    captionHidden
  />
</Story>

<Story name="Starting sorted">
  <DataGrid
    rows={devices}
    {columns}
    {rowKey}
    pageSize={5}
    sort={{ key: 'sessions', direction: 'desc' }}
    caption="Busiest first"
  />
</Story>

<Story name="Nothing matches">
  <DataGrid
    rows={[]}
    {columns}
    {rowKey}
    filterable
    caption="Your devices"
    emptyMessage="No devices are registered to this account."
  />
</Story>

<Story name="Selection and columns">
  <!-- Selections are keyed by row, so they survive the filter, a sort and a
       page change; select-all covers the page on screen. -->
  <DataGrid
    rows={devices}
    {columns}
    {rowKey}
    filterable
    pageSize={5}
    caption="Your devices"
    selection="multiple"
    columnMenu
  />
</Story>

<Story name="Price list (cell editing)">
  <!-- Each commit is saved on its own. The pretend server takes half a
       second (the cell is busy meanwhile) and refuses a price over 100: the
       cell rolls back and the reason is announced. Arrow to a cell and press
       Enter, or just start typing. -->
  <DataGrid
    rows={prices}
    columns={productColumns}
    rowKey={productKey}
    paginated={false}
    caption="Price list"
    editing="cell"
    onCellCommit={savePrice}
  />
</Story>

<Story name="Import review (batch editing with errors)">
  <!-- The rows arrive with problems; the summary counts them and each entry
       focuses its cell. Fixes collect as changes until Save. -->
  <div class="space-y-3">
    <DataGrid
      rows={contacts}
      columns={contactColumns}
      rowKey={lineKey}
      paginated={false}
      caption="Imported contacts"
      editing="batch"
      bind:changes={pending}
    />
    <Button onclick={saveBatch} disabled={pending.length === 0}>
      Save {pending.length} change{pending.length === 1 ? '' : 's'}
    </Button>
  </div>
</Story>

<Story name="Large import (virtual, 5,000 rows)">
  <!-- `virtual` windows the rows instead of paging them: only the rows in
       view are in the DOM, yet every row states its place in all 5,001, the
       arrow and Page keys reach any row, and each summary entry scrolls its
       distant row into view and focuses the cell. -->
  <div class="space-y-3">
    <DataGrid
      rows={bulk}
      columns={contactColumns}
      rowKey={lineKey}
      filterable
      caption="Imported contacts (5,000)"
      editing="batch"
      virtual
      viewportHeight="28rem"
      bind:changes={bulkPending}
    />
    <Button onclick={saveBulk} disabled={bulkPending.length === 0}>
      Save {bulkPending.length} change{bulkPending.length === 1 ? '' : 's'}
    </Button>
  </div>
</Story>
