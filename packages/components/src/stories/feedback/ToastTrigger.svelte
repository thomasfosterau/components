<!-- Story helper: a button that pushes a toast into the enclosing `Toaster`.
     `getToaster()` has to run during a DESCENDANT's init, so it cannot live in
     the story file itself. Not a component of the library. -->
<script lang="ts">
  import { getToaster, type ToastTone } from '../../lib/feedback/toaster.ts';
  import Button from '../../lib/ui/Button.svelte';
  import type { Tone } from '../../lib/ui/tones.ts';

  interface Props {
    title: string;
    description?: string | undefined;
    tone?: ToastTone | undefined;
    durationMs?: number | undefined;
    buttonLabel: string;
    buttonTone?: Tone | undefined;
  }

  let { title, description, tone, durationMs, buttonLabel, buttonTone }: Props = $props();

  const toaster = getToaster();
</script>

<Button
  tone={buttonTone}
  onclick={() => {
    toaster.add({ title, description, tone }, durationMs);
  }}
>
  {buttonLabel}
</Button>
