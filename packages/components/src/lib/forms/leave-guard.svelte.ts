/**
 * leave-guard — ask before the reader leaves a page with unsaved changes.
 *
 * Two doors out of a page, two mechanisms. Closing the tab, reloading or
 * typing another address goes through the browser's `beforeunload`, which the
 * guard handles itself, and only while the page is dirty (a permanent
 * listener disqualifies the page from the back/forward cache). An in-app link
 * is the router's, and the router is the app's: the library cannot import
 * `$app/navigation`, so the guard exposes `shouldBlock()` and
 * `confirmLeave()` for the app's own `beforeNavigate`, and `LeaveGuardDialog`
 * renders the Leave / Stay question. See `LeaveGuardDialog` for the wiring.
 *
 * @module
 */

/** What `createLeaveGuard` takes. */
export interface LeaveGuardOptions {
  /** Whether there are unsaved changes right now. Read reactively. */
  readonly dirty: () => boolean;
  /**
   * Heading of the confirmation.
   * @defaultValue `'Leave this page?'`
   */
  readonly title?: string | undefined;
  /**
   * Body of the confirmation.
   * @defaultValue `'Changes you made will not be saved.'`
   */
  readonly message?: string | undefined;
  /**
   * Text of the button that leaves.
   * @defaultValue `'Leave'`
   */
  readonly leaveLabel?: string | undefined;
  /**
   * Text of the button that stays.
   * @defaultValue `'Stay'`
   */
  readonly stayLabel?: string | undefined;
}

/** What `LeaveGuardDialog` renders: the open question and its copy. */
export interface LeaveGuardDialogState {
  /** Whether the question is on screen. */
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly leaveLabel: string;
  readonly stayLabel: string;
  /** Answer the question: `true` leaves, `false` stays. A no-op when nothing is asked. */
  settle(leave: boolean): void;
}

/** The guard `createLeaveGuard` returns. */
export interface LeaveGuard {
  /** Whether there are unsaved changes right now. */
  readonly dirty: boolean;
  /** Whether a navigation should be cancelled and put to the reader: true while dirty. */
  shouldBlock(): boolean;
  /**
   * Resolves `true` at once while clean. While dirty it opens the Leave / Stay
   * `alertdialog` (focus on Stay) and resolves with the answer; Escape is Stay.
   * A second call while the question is open gets the same answer.
   */
  confirmLeave(): Promise<boolean>;
  /** The state `LeaveGuardDialog` renders. */
  readonly dialog: LeaveGuardDialogState;
}

const beforeUnload = (event: BeforeUnloadEvent): void => {
  event.preventDefault();
};

/**
 * Create a leave guard. Call it while a component initialises (the
 * `beforeunload` listener is a `$effect`), and mount one `LeaveGuardDialog`
 * for it.
 *
 * `beforeunload` is registered only while `dirty()` is true and removed the
 * moment it is not. Browsers show their own generic text there and ignore any
 * custom message, so the guard sets none.
 */
export const createLeaveGuard = (options: LeaveGuardOptions): LeaveGuard => {
  let open = $state(false);
  let settleOpen: ((leave: boolean) => void) | undefined;
  let question: Promise<boolean> | undefined;

  $effect(() => {
    if (!options.dirty()) return;
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
    };
  });

  const settle = (leave: boolean): void => {
    settleOpen?.(leave);
  };

  const confirmLeave = (): Promise<boolean> => {
    if (!options.dirty()) return Promise.resolve(true);
    question ??= new Promise<boolean>((resolve) => {
      open = true;
      settleOpen = (leave) => {
        open = false;
        settleOpen = undefined;
        question = undefined;
        resolve(leave);
      };
    });
    return question;
  };

  return {
    get dirty() {
      return options.dirty();
    },
    shouldBlock: () => options.dirty(),
    confirmLeave,
    dialog: {
      get open() {
        return open;
      },
      title: options.title ?? 'Leave this page?',
      message: options.message ?? 'Changes you made will not be saved.',
      leaveLabel: options.leaveLabel ?? 'Leave',
      stayLabel: options.stayLabel ?? 'Stay',
      settle,
    },
  };
};
