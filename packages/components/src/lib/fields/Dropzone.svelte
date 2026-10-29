<!-- @component
Choose one or many files by dropping them on a target or through a "Choose files" button, with a removable file list and explained rejections; never uploads.
-->
<!--
  Dropzone — a drop target plus a real "Choose files" button, a list of the
  chosen files (name, size, optional thumbnail) each with a remove button,
  and client-side `accept` / `maxBytes` / `maxFiles` checks whose rejections
  are explained. It binds a `File[]` and never uploads: the transfer is the
  caller's, as with `FileInput`.

  Hand-rolled, and why (AGENTS.md): no bits-ui primitive exists for file
  drops, and the contract is small — one button, one list, one alert —
  pinned by `tests/fields/Dropzone.test.ts`. The checks are the pure helpers
  in `file-validation.ts`, shared with `FileInput`.

  A real `<input type="file">` sits inside, visually hidden, carrying
  `name`, `accept`, `multiple` and `required`. Every change to `files` — a
  pick, a drop, a removal, the caller's own write — is synced into it through
  a `DataTransfer`, so a plain form POST posts exactly the listed files.
  A drop is NOT filtered by the browser against `accept`, which is why the
  checks run on drops too.

  ARIA contract (no APG pattern; these are the guarantees):
  - The drop area is never the only way in. The "Choose files" `<button>`
    opens the native picker, and it carries the `FieldControl` id, so
    `FormField`'s `<label for>` names it, plus `aria-describedby`
    (`describedBy`, then the rejection alert). It takes no `aria-invalid` —
    the `button` role does not support it — so `invalid` reaches assistive
    technology through `FormField`'s error text in that description. The drop
    area itself is not focusable; `promptLabel` sits in front of the button.
  - Drag-over is visual only (`data-dragging`), never announced.
  - The files are a `<ul>` of `<li>`; each remove button is named by
    `removeLabel(file)`. After a removal, focus moves to the next remove
    button, else the previous one, else the choose button.
  - Rejections from the last selection render in one `role="alert"`
    region (`FieldErrors`), cleared by the next selection.
  - A polite live region says how many files are selected after each
    selection or drop, since a drop otherwise produces no announcement.

  Previews: an image file gets an object-URL thumbnail when `previews` is
  on; every URL is revoked when its file leaves the list and when the
  component is destroyed.
-->
<script lang="ts">
  import { tick, untrack, type Snippet } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getComponentsContext } from '../context.svelte.ts';
  import FieldErrors from './FieldErrors.svelte';
  import { acceptMatches, exceedsSize, formatFileSize, type FileRejection } from './file-validation.ts';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'ondrop' | 'id'> {
    /**
     * The chosen files. Bindable.
     * @defaultValue `[]`
     */
    files?: File[] | undefined;
    /** The native `accept` syntax (`image/*`, `.pdf`, `application/json`); also enforced on drop. */
    accept?: string | undefined;
    /** Per-file size cap, in bytes. Omitted, there is no cap. */
    maxBytes?: number | undefined;
    /** Cap on the number of files; extra files are rejected with `tooManyMessage`. */
    maxFiles?: number | undefined;
    /**
     * Allow more than one file. Off, a new choice replaces the current file.
     * @defaultValue `true`
     */
    multiple?: boolean | undefined;
    /** Posts the files under this name through the inner native input. */
    name?: string | undefined;
    /** Called after each pick or drop with the files accepted and the ones refused. */
    onSelect?: ((accepted: readonly File[], rejected: readonly FileRejection[]) => void) | undefined;
    /**
     * Show a thumbnail for image files.
     * @defaultValue `true`
     */
    previews?: boolean | undefined;
    /**
     * Text in front of the choose button.
     * @defaultValue `'Drop files here or'`
     */
    promptLabel?: string | undefined;
    /**
     * The choose button's text.
     * @defaultValue `'Choose files'`
     */
    chooseLabel?: string | undefined;
    /**
     * Accessible name of a file's remove button.
     * @defaultValue `(file) => \`Remove ${file.name}\``
     */
    removeLabel?: ((file: File) => string) | undefined;
    /**
     * Shown for a file over `maxBytes`.
     * @defaultValue `(file) => \`${file.name} is too large.\``
     */
    tooLargeMessage?: ((file: File) => string) | undefined;
    /**
     * Shown for a file `accept` refuses.
     * @defaultValue `(file) => \`${file.name} is not an accepted file type.\``
     */
    wrongTypeMessage?: ((file: File) => string) | undefined;
    /**
     * Shown once when a selection would pass `maxFiles`.
     * @defaultValue `(max) => \`Choose at most ${max} files.\``
     */
    tooManyMessage?: ((max: number) => string) | undefined;
    /**
     * Live-region text after a selection or drop.
     * @defaultValue `(count) => count === 1 ? '1 file selected' : \`${count} files selected\``
     */
    selectedMessage?: ((count: number) => string) | undefined;
    /** BCP 47 locale(s) for the file sizes; falls back to the context's `locale()`. */
    locales?: string | readonly string[] | undefined;
    /** Replaces a file row's body, e.g. to add upload progress the caller tracks. */
    file?: Snippet<[File, { remove: () => void }]> | undefined;
    /**
     * Disables the button, the drop target and the remove buttons.
     * @defaultValue `false`
     */
    disabled?: boolean | undefined;
    /** `FieldControl`: the choose button's `id`, which `FormField`'s label points at. Minted when omitted. */
    id?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — the choose button is
     * labelable, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for the button's `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the field is in error — draws the error border (the message reaches the button through `describedBy`).
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: at least one file is required (on the native input).
     * @defaultValue `false`
     */
    required?: boolean | undefined;
  }

  let {
    files = $bindable([]),
    accept,
    maxBytes,
    maxFiles,
    multiple = true,
    name,
    onSelect,
    previews = true,
    promptLabel = 'Drop files here or',
    chooseLabel = 'Choose files',
    removeLabel = (file: File) => `Remove ${file.name}`,
    tooLargeMessage = (file: File) => `${file.name} is too large.`,
    wrongTypeMessage = (file: File) => `${file.name} is not an accepted file type.`,
    tooManyMessage = (max: number) => `Choose at most ${max} files.`,
    selectedMessage = (count: number) => (count === 1 ? '1 file selected' : `${count} files selected`),
    locales = getComponentsContext().locale(),
    file: fileRow,
    disabled = false,
    id: idProp,
    labelId: _labelId,
    describedBy = '',
    invalid = false,
    required = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const buttonId = $derived(idProp ?? uid);
  const errorsId = $derived(`${uid}-errors`);

  let input = $state<HTMLInputElement | null>(null);
  let chooseButton = $state<HTMLButtonElement | null>(null);
  let root = $state<HTMLDivElement | null>(null);
  let dragging = $state(false);
  let rejections = $state<readonly FileRejection[]>([]);
  let announcement = $state('');
  const previewUrls = new SvelteMap<File, string>();

  const cap = $derived(multiple ? maxFiles : 1);
  const messages = $derived(rejectionMessages(rejections));
  const described = $derived(
    [describedBy, messages.length > 0 ? errorsId : ''].filter((part) => part !== '').join(' '),
  );

  function rejectionMessages(list: readonly FileRejection[]): string[] {
    const out = list
      .filter((rejection) => rejection.reason !== 'too-many')
      .map((rejection) =>
        rejection.reason === 'too-large' ? tooLargeMessage(rejection.file) : wrongTypeMessage(rejection.file),
      );
    if (cap !== undefined && list.some((rejection) => rejection.reason === 'too-many')) {
      out.push(tooManyMessage(cap));
    }
    return out;
  }

  /** Which rule, if any, refuses `candidate` once `taken` files are already in. */
  function refusal(candidate: File, taken: number): FileRejection['reason'] | undefined {
    if (!acceptMatches(candidate, accept)) return 'wrong-type';
    if (exceedsSize(candidate, maxBytes)) return 'too-large';
    if (cap !== undefined && taken >= cap) return 'too-many';
    return undefined;
  }

  /** Check a pick or a drop, keep what passes, explain what does not. */
  function take(incoming: readonly File[]): void {
    const base = multiple ? files : [];
    const accepted: File[] = [];
    const rejected: FileRejection[] = [];
    for (const candidate of incoming) {
      const reason = refusal(candidate, base.length + accepted.length);
      if (reason === undefined) accepted.push(candidate);
      else rejected.push({ file: candidate, reason });
    }
    if (accepted.length > 0 || !multiple) files = [...base, ...accepted];
    rejections = rejected;
    announcement = selectedMessage(files.length);
    onSelect?.(accepted, rejected);
  }

  async function remove(index: number): Promise<void> {
    files = files.filter((_, at) => at !== index);
    announcement = selectedMessage(files.length);
    // Let the list re-render before choosing where focus goes.
    await tick();
    const left = [...(root?.querySelectorAll<HTMLButtonElement>('[data-dropzone-remove]') ?? [])];
    (left[index] ?? left[index - 1] ?? chooseButton)?.focus();
  }

  /** Mirror `files` into the native input, so a form POST sends exactly the listed files. */
  function syncInput(current: readonly File[]): void {
    if (input === null) return;
    const transfer = new DataTransfer();
    for (const entry of current) transfer.items.add(entry);
    input.files = transfer.files;
  }

  $effect(() => {
    const current = files;
    untrack(() => {
      for (const entry of current) {
        if (previews && entry.type.startsWith('image/') && !previewUrls.has(entry)) {
          previewUrls.set(entry, URL.createObjectURL(entry));
        }
      }
      for (const [entry, url] of previewUrls) {
        if (!current.includes(entry)) {
          URL.revokeObjectURL(url);
          previewUrls.delete(entry);
        }
      }
      syncInput(current);
    });
  });

  $effect(() => () => {
    for (const url of previewUrls.values()) URL.revokeObjectURL(url);
  });

  function dragOver(event: DragEvent): void {
    event.preventDefault();
    if (disabled) return;
    dragging = true;
    if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'copy';
  }

  function dragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;
    dragging = false;
  }

  function drop(event: DragEvent): void {
    event.preventDefault();
    dragging = false;
    if (disabled) return;
    take([...(event.dataTransfer?.files ?? [])]);
  }

  function picked(event: Event & { currentTarget: HTMLInputElement }): void {
    const chosen = [...(event.currentTarget.files ?? [])];
    // The native input now holds only the new pick; `take` decides the list,
    // and the sync effect writes it back.
    take(chosen);
    syncInput(files);
  }
</script>

{#snippet row(entry: File, index: number)}
  {@const preview = previewUrls.get(entry)}
  {#if preview !== undefined}
    <img src={preview} alt="" class="rounded-field size-10 object-cover" />
  {/if}
  <span class="min-w-0 grow truncate">{entry.name}</span>
  <span class="text-base-content/70 text-sm tabular-nums">{formatFileSize(entry.size, locales)}</span>
  <button
    data-dropzone-remove
    type="button"
    {disabled}
    class="btn btn-ghost btn-sm"
    onclick={() => void remove(index)}
  >
    {removeLabel(entry)}
  </button>
{/snippet}

<div
  {...rest}
  bind:this={root}
  data-dragging={dragging ? '' : undefined}
  ondragenter={dragOver}
  ondragover={dragOver}
  ondragleave={dragLeave}
  ondrop={drop}
  class={[
    'rounded-box bg-base-100 border-2 border-dashed p-4',
    invalid || messages.length > 0 ? 'border-error' : 'border-base-300',
    'data-[dragging]:border-primary data-[dragging]:bg-base-200',
    disabled && 'opacity-50',
    className,
  ]}
>
  <div class="flex flex-wrap items-center justify-center gap-2 py-4 text-center">
    <span>{promptLabel}</span>
    <button
      bind:this={chooseButton}
      id={buttonId}
      type="button"
      {disabled}
      aria-describedby={described === '' ? undefined : described}
      class="btn btn-sm"
      onclick={() => input?.click()}
    >
      {chooseLabel}
    </button>
  </div>
  <input
    bind:this={input}
    type="file"
    class="sr-only"
    tabindex="-1"
    aria-hidden="true"
    {name}
    {accept}
    {multiple}
    {required}
    {disabled}
    onchange={picked}
  />
  {#if files.length > 0}
    <ul class="mt-2 flex flex-col gap-2">
      {#each files as entry, index (entry)}
        <li class="flex items-center gap-3">
          {#if fileRow}
            {@render fileRow(entry, { remove: () => void remove(index) })}
          {:else}
            {@render row(entry, index)}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
  <FieldErrors errors={messages} id={errorsId} />
  <p class="sr-only" aria-live="polite">{announcement}</p>
</div>
