<!-- @component
One task in a `TaskList`: a linked title, an optional hint and a status tag.
-->
<!--
  ARIA contract: the title is the row's only interactive element, a link
  described by the hint and status ("Add beds, link, Completed") and stretched
  over the row. Without a link (`'cannot-start'`, or no `href`) the title is
  plain text: HTML has no disabled link.
--><script lang="ts">
  import type { HTMLLiAttributes } from 'svelte/elements';
  import Badge from '../ui/Badge.svelte';
  import Link from '../ui/Link.svelte';
  import { defaultTaskStatusLabels, taskStatusBadge, type TaskStatus } from './task-list.ts';

  interface Props extends Omit<HTMLLiAttributes, 'title' | 'children'> {
    /** The task's name; the link's accessible name. */
    title: string;
    /** Where the task is done; resolved through the components context. Ignored for `'cannot-start'`. */
    href?: string | undefined;
    /** One line of context under the title. */
    hint?: string | undefined;
    /** Where the task stands. */
    status: TaskStatus;
    /**
     * The status text.
     * @defaultValue the English label for `status`, e.g. `'Not started'`
     */
    statusLabel?: string | undefined;
  }

  let { title, href, hint, status, statusLabel, class: className, ...rest }: Props = $props();

  const uid = $props.id();
  const hintId = `${uid}-hint`;
  const statusId = `${uid}-status`;

  const linked = $derived(href !== undefined && status !== 'cannot-start');
  const badge = $derived(taskStatusBadge[status]);
  const describedBy = $derived(hint === undefined ? statusId : `${hintId} ${statusId}`);
</script>

<li
  {...rest}
  class={[
    'relative flex items-start justify-between gap-4 px-2 py-3',
    linked && 'hover:bg-base-200 focus-within:bg-base-200',
    className,
  ]}
>
  <div class="min-w-0">
    {#if linked && href !== undefined}
      <Link
        {href}
        aria-describedby={describedBy}
        class="font-medium after:absolute after:inset-0 after:content-['']"
      >
        {title}
      </Link>
    {:else}
      <span class="font-medium">{title}</span>
    {/if}
    {#if hint !== undefined}
      <p id={hintId} class="text-base-content/70 text-sm">{hint}</p>
    {/if}
  </div>
  <strong id={statusId} class="shrink-0 font-normal">
    <Badge tone={badge.tone} variant={badge.variant}>
      {statusLabel ?? defaultTaskStatusLabels[status]}
    </Badge>
  </strong>
</li>
