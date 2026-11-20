<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import TaskList from '../../lib/data/TaskList.svelte';

  const { Story } = defineMeta({
    title: 'Data/TaskList',
    component: TaskList,
    parameters: {
      docs: {
        description: {
          component:
            'Tasks done in any order, each with its status as text. The title is the row’s one link, stretched over the row and described by the hint and the status; a task that cannot start yet is plain text. A fixed sequence is `Steps`.',
        },
      },
    },
  });
</script>

<Story name="Onboarding checklist" asChild>
  <TaskList
    sections={[
      {
        tasks: [
          { id: 'beds', title: 'Add beds', href: '/beds', status: 'completed' },
          { id: 'invite', title: 'Invite collaborators', href: '/invite', status: 'not-started' },
          {
            id: 'zone',
            title: 'Choose a climate zone',
            href: '/zone',
            hint: 'Sets your frost dates',
            status: 'in-progress',
          },
        ],
      },
    ]}
  />
</Story>

<Story name="Multi-section application" asChild>
  <TaskList
    summaryLabel={(done, total) => `You have completed ${done} of ${total} sections`}
    sections={[
      {
        title: 'Prepare application',
        tasks: [
          { id: 'contact', title: 'Contact details', href: '/contact', status: 'completed' },
          { id: 'site', title: 'Site plan', href: '/site', status: 'completed' },
          { id: 'water', title: 'Water use', href: '/water', status: 'in-progress' },
        ],
      },
      {
        title: 'Apply',
        tasks: [
          {
            id: 'submit',
            title: 'Check and submit',
            hint: 'Available once every section is complete',
            status: 'cannot-start',
          },
        ],
      },
    ]}
  />
</Story>

<Story name="With errors" asChild>
  <TaskList
    sections={[
      {
        title: 'Import your plants',
        tasks: [
          { id: 'upload', title: 'Upload a spreadsheet', href: '/upload', status: 'completed' },
          {
            id: 'map',
            title: 'Match the columns',
            href: '/map',
            hint: '3 rows have no species',
            status: 'error',
          },
          { id: 'review', title: 'Review and save', href: '/review', status: 'not-started' },
        ],
      },
    ]}
  />
</Story>
