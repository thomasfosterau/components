import type { BadgeVariant, Tone } from '../ui/tones.ts';

/** Where a task stands; `'cannot-start'` tasks render without a link. */
export type TaskStatus = 'completed' | 'in-progress' | 'not-started' | 'cannot-start' | 'error';

/** One row of a `TaskList`. */
export interface Task {
  /** Stable key for the row. */
  readonly id: string;
  /** The task's name, and its link's accessible name. */
  readonly title: string;
  /** Where the task is done; ignored for `'cannot-start'`. */
  readonly href?: string | undefined;
  /** One line of context under the title. */
  readonly hint?: string | undefined;
  readonly status: TaskStatus;
}

/** A titled group of tasks; leave `title` out for a flat list. */
export interface TaskListSection {
  readonly title?: string | undefined;
  readonly tasks: readonly Task[];
}

/** The English status texts `TaskList` and `TaskListItem` default to. */
export const defaultTaskStatusLabels: Readonly<Record<TaskStatus, string>> = {
  completed: 'Completed',
  'in-progress': 'In progress',
  'not-started': 'Not started',
  'cannot-start': 'Cannot start yet',
  error: 'There is a problem',
};

/**
 * The status tag's look per status. "Completed" is deliberately the quietest:
 * the eye should land on what is left to do.
 */
export const taskStatusBadge: Readonly<
  Record<TaskStatus, { readonly tone: Tone | 'none'; readonly variant: BadgeVariant }>
> = {
  completed: { tone: 'none', variant: 'ghost' },
  'in-progress': { tone: 'info', variant: 'soft' },
  'not-started': { tone: 'none', variant: 'outline' },
  'cannot-start': { tone: 'none', variant: 'dash' },
  error: { tone: 'error', variant: 'soft' },
};
