<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DataGrid from '../../lib/data/DataGrid.svelte';
  import type { TableColumn } from '../../lib/data/table-types.ts';

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
