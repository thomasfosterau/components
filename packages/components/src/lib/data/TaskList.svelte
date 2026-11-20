<!-- @component
A list of tasks done in any order, each with its status, optionally in sections under a progress summary.
-->
<!--
  For tasks done in any order; a fixed sequence is `Steps`. Follows the GOV.UK
  task list: a heading and a `<ul>` per section. The summary is text and a
  `<progress>`, not a live region: the list is page content.
--><script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import ProgressBar from '../feedback/ProgressBar.svelte';
  import type { HeadingLevel } from '../ui/tones.ts';
  import TaskListItem from './TaskListItem.svelte';
  import { defaultTaskStatusLabels, type TaskListSection, type TaskStatus } from './task-list.ts';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Sections of tasks; one section without a `title` for a flat list. */
    sections: readonly TaskListSection[];
    /**
     * Show "You have completed n of m tasks" and a progress bar above the list.
     * @defaultValue `true`
     */
    summary?: boolean | undefined;
    /**
     * Status texts, merged over the English defaults.
     * @defaultValue `'Completed'`, `'In progress'`, `'Not started'`, `'Cannot start yet'`, `'There is a problem'`
     */
    statusLabels?: Partial<Record<TaskStatus, string>> | undefined;
    /**
     * The summary sentence.
     * @defaultValue `(done, total) => \`You have completed ${done} of ${total} tasks\``
     */
    summaryLabel?: ((done: number, total: number) => string) | undefined;
    /**
     * Accessible name of the summary's progress bar.
     * @defaultValue `'Tasks completed'`
     */
    progressLabel?: string | undefined;
    /**
     * Heading level of the section titles.
     * @defaultValue `2`
     */
    level?: Exclude<HeadingLevel, 1> | undefined;
  }

  let {
    sections,
    summary = true,
    statusLabels,
    summaryLabel = (done, total) => `You have completed ${done} of ${total} tasks`,
    progressLabel = 'Tasks completed',
    level = 2,
    class: className,
    ...rest
  }: Props = $props();

  const labels = $derived({ ...defaultTaskStatusLabels, ...statusLabels });
  const tasks = $derived(sections.flatMap((section) => section.tasks));
  const done = $derived(tasks.filter((task) => task.status === 'completed').length);
</script>

<div {...rest} class={['flex flex-col gap-6', className]}>
  {#if summary && tasks.length > 0}
    <div class="flex flex-col gap-2">
      <p>{summaryLabel(done, tasks.length)}</p>
      <ProgressBar label={progressLabel} value={done} max={tasks.length} />
    </div>
  {/if}
  {#each sections as section, index (index)}
    <div class="flex flex-col gap-2">
      {#if section.title !== undefined}
        <svelte:element this={`h${level}`} class="text-lg font-semibold">
          {section.title}
        </svelte:element>
      {/if}
      <ul class="divide-base-300 border-base-300 divide-y border-y">
        {#each section.tasks as task (task.id)}
          <TaskListItem
            title={task.title}
            href={task.href}
            hint={task.hint}
            status={task.status}
            statusLabel={labels[task.status]}
          />
        {/each}
      </ul>
    </div>
  {/each}
</div>
