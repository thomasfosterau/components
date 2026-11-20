<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import SignaturePad from '../../lib/fields/SignaturePad.svelte';

  const { Story } = defineMeta({
    title: 'Fields/SignaturePad',
    component: SignaturePad,
    parameters: {
      docs: {
        description: {
          component:
            'Draw a signature, or type a name instead: the Type tab is the keyboard and screen-reader path. The value is an SVG; `signatureToPng` exports a PNG.',
        },
      },
    },
  });
</script>

<Story name="Volunteer waiver">
  {#snippet template()}
    <form class="flex max-w-lg flex-col gap-4">
      <p class="text-sm">
        I agree to follow the garden's safety rules and accept the risks of working on site.
      </p>
      <FormField label="Signature" required>
        {#snippet children(control)}
          <SignaturePad {...control} name="signature" suggestedName="Alex Gardener" />
        {/snippet}
      </FormField>
      <button type="submit" class="btn btn-primary self-start">Sign waiver</button>
    </form>
  {/snippet}
</Story>

<Story name="Wide pad, thick stroke">
  {#snippet template()}
    <div class="max-w-xl">
      <FormField label="Delivery received by">
        {#snippet children(control)}
          <SignaturePad {...control} aspect={4} strokeWidth="lg" />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>

<Story name="Dark theme">
  {#snippet template()}
    <div data-theme="dark" class="bg-base-100 text-base-content max-w-lg p-4">
      <FormField label="Signature">
        {#snippet children(control)}
          <SignaturePad {...control} />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>
