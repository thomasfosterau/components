<!-- Form mode, with a hidden input in the confirm form; the submit is caught
     so the test runner's page is not navigated away. -->
<script lang="ts">
  import ConfirmButton from '../../../src/lib/ui/ConfirmButton.svelte';

  interface Props {
    onSubmit: (data: FormData, form: HTMLFormElement) => void;
    action?: (() => Promise<unknown>) | undefined;
  }

  let { onSubmit, action }: Props = $props();
</script>

{#snippet formFields()}
  <input type="hidden" name="id" value="garden-7" />
{/snippet}

<div
  onsubmit={(event) => {
    event.preventDefault();
    if (event.target instanceof HTMLFormElement) {
      onSubmit(new FormData(event.target), event.target);
    }
  }}
>
  <ConfirmButton
    formAction="/gardens/7?/delete"
    {formFields}
    {action}
    idleLabel="Delete this garden"
  />
</div>
