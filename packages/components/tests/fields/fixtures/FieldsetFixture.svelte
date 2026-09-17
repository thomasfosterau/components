<script lang="ts">
  import Checkbox from '../../../src/lib/fields/Checkbox.svelte';
  import Fieldset from '../../../src/lib/fields/Fieldset.svelte';

  interface Props {
    legend: string;
    hint?: string | undefined;
    errors?: readonly string[] | undefined;
    required?: boolean | undefined;
  }

  let { legend, hint, errors, required }: Props = $props();
</script>

<Fieldset {legend} {hint} {errors} {required}>
  <Checkbox label="Full sun" />
  <Checkbox label="Part shade" />
</Fieldset>
