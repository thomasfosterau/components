<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Dropzone from '../../lib/fields/Dropzone.svelte';
  import FormField from '../../lib/fields/FormField.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Dropzone',
    component: Dropzone,
    parameters: {
      docs: {
        description: {
          component:
            'Drop files on the target or use the "Choose files" button, the way in that always works. `accept`, `maxBytes` and `maxFiles` are checked on drops too, and rejections are explained. A real `<input type="file">` inside keeps form posting working. The component never uploads.',
        },
      },
    },
  });

  // A tiny PNG and two documents, so the stories show a list without a drop.
  const pixel = Uint8Array.from(
    atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
    (char) => char.charCodeAt(0),
  );
  const photo = new File([pixel], 'bed-3.png', { type: 'image/png' });
  const report = new File([new Uint8Array(2_400_000)], 'soil-report.pdf', { type: 'application/pdf' });
  const notes = new File([new Uint8Array(84_000)], 'notes.pdf', { type: 'application/pdf' });

  const progress = new Map([
    ['soil-report.pdf', 64],
    ['notes.pdf', 100],
  ]);
</script>

<Story name="Images with previews">
  <div class="max-w-lg">
    <FormField label="Photos" hint="PNG or JPEG, up to 5 MB each.">
      {#snippet children(control)}
        <Dropzone {...control} name="photos" accept="image/*" maxBytes={5_000_000} files={[photo]} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Documents">
  <div class="max-w-lg">
    <FormField label="Reports">
      {#snippet children(control)}
        <Dropzone {...control} name="reports" accept=".pdf" files={[report, notes]} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Limits">
  <div class="max-w-lg">
    <FormField label="Up to two PDFs of 100 kB" hint="Drop three, or a large one, to see the rejections.">
      {#snippet children(control)}
        <Dropzone {...control} accept=".pdf" maxBytes={100_000} maxFiles={2} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Caller-tracked progress">
  <div class="max-w-lg">
    <FormField label="Uploads">
      {#snippet children(control)}
        <Dropzone {...control} files={[report, notes]}>
          {#snippet file(entry, { remove })}
            <span class="min-w-0 grow truncate">{entry.name}</span>
            <progress class="progress w-32" value={progress.get(entry.name) ?? 0} max="100" aria-label={`${entry.name} upload progress`}></progress>
            <button type="button" class="btn btn-ghost btn-sm" onclick={remove}>Remove {entry.name}</button>
          {/snippet}
        </Dropzone>
      {/snippet}
    </FormField>
  </div>
</Story>
