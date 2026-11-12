<!-- @component
The Leave / Stay `alertdialog` for a `createLeaveGuard` guard; mount one beside the page's form.
-->
<!--
  LeaveGuardDialog — renders the question a leave guard asks. The guard owns
  the state (a promise settled by Leave or Stay) and this component only
  draws it, which is how the library asks the question without importing
  `$app/*`: a component that renders guard state is the idiomatic Svelte 5
  shape, where a guard that mounted its own dialog would have to reach the
  document from a plain `.svelte.ts` module.

  Wiring, in the app's layout or on the editing page (SvelteKit):

    const guard = createLeaveGuard({ dirty: () => form.isTainted });
    let leaving = false;
    beforeNavigate((nav) => {
      if (leaving || nav.type === 'leave' || !guard.shouldBlock()) return;
      nav.cancel();
      void guard.confirmLeave().then((leave) => {
        if (leave && nav.to) { leaving = true; void goto(nav.to.url); }
      });
    });

  `nav.type === 'leave'` (the tab closing) is the guard's `beforeunload`.

  ARIA contract: bits-ui's `AlertDialog` — `role="alertdialog"` named by the
  title and described by the message, `aria-modal`, a focus trap, and focus
  returned to what had it. Focus opens on Stay, the safe default, and Escape
  is Stay. There is no corner close button and an outside click does not
  dismiss: the reader must answer.
-->
<script lang="ts">
  import { AlertDialog } from 'bits-ui';
  import Button from '../ui/Button.svelte';
  import type { LeaveGuard } from './leave-guard.svelte.ts';

  interface Props {
    /** The guard from `createLeaveGuard`. */
    guard: LeaveGuard;
    /** Extra classes on the `modal-box`, merged last. */
    class?: string | undefined;
  }

  let { guard, class: className }: Props = $props();

  let stay = $state<HTMLButtonElement | null>(null);

  const onOpenAutoFocus = (event: Event): void => {
    if (stay === null) return;
    event.preventDefault();
    stay.focus();
  };
</script>

<AlertDialog.Root
  open={guard.dialog.open}
  onOpenChange={(next) => {
    if (!next) guard.dialog.settle(false);
  }}
>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="bg-base-300/60 fixed inset-0 z-40" />
    <AlertDialog.Content
      {onOpenAutoFocus}
      class={[
        'modal-box fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2',
        className,
      ]}
    >
      <AlertDialog.Title class="text-lg font-semibold">{guard.dialog.title}</AlertDialog.Title>
      <AlertDialog.Description class="text-base-content/70 mt-1 text-sm leading-6">
        {guard.dialog.message}
      </AlertDialog.Description>
      <div class="modal-action">
        <Button
          tone="error"
          variant="ghost"
          onclick={() => {
            guard.dialog.settle(true);
          }}
        >
          {guard.dialog.leaveLabel}
        </Button>
        <AlertDialog.Cancel bind:ref={stay}>
          {#snippet child({ props })}
            <Button {...props} tone="primary">{guard.dialog.stayLabel}</Button>
          {/snippet}
        </AlertDialog.Cancel>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
