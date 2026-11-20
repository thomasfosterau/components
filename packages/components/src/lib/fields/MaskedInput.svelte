<!-- @component
A `TextInput` that formats structured values as they are typed (`0412 345 678`), keeping the caret in place and a raw value for the form.
-->
<!--
  Hand-rolled rather than on a mask library: the core is a few small pure
  functions (`mask.ts`), tested without a browser. Literals appear only
  once a character follows them, so no placeholder characters are read
  out; Backspace and Delete step over a literal; paste is stripped to raw;
  a rejected letter or digit is announced once. `formatOn="blur"` leaves
  the field free while focused, which suits anything people paste.
-->
<script lang="ts">
  import { tick, type ComponentProps } from 'svelte';
  import {
    caretAfter,
    deleteAcrossLiteral,
    format,
    patternFor,
    rawBefore,
    slotKind,
    toRaw,
    type Mask,
    type MaskPreset,
  } from './mask.ts';
  import TextInput from './TextInput.svelte';

  type TextInputProps = ComponentProps<typeof TextInput>;

  interface Props extends Omit<TextInputProps, 'value' | 'type' | 'showCount' | 'maxlength'> {
    /**
     * A pattern (`9` a digit, `a` a letter, `*` either, anything else a
     * literal), a function choosing one from the raw text, or one of
     * `maskPresets`.
     */
    mask: Mask | MaskPreset;
    /**
     * The raw value: what was typed, without literals. Bindable.
     * @defaultValue `''`
     */
    value?: string | undefined;
    /**
     * The value as formatted. Bindable; read-only in practice.
     * @defaultValue `''`
     */
    formatted?: string | undefined;
    /** Called with the raw value after each change. */
    onValueChange?: ((value: string) => void) | undefined;
    /**
     * Post the formatted value under `name` instead of the raw one.
     * @defaultValue `false`
     */
    submitFormatted?: boolean | undefined;
    /**
     * Format while typing, or only once the field loses focus.
     * @defaultValue `'input'`
     */
    formatOn?: 'input' | 'blur' | undefined;
    /**
     * Announced once when a typed character is the wrong kind.
     * @defaultValue `'Numbers only'`, `'Letters only'` or `'Letters and numbers only'`, by the mask
     */
    rejectedLabel?: string | undefined;
  }

  let {
    mask,
    value = $bindable(''),
    formatted = $bindable(''),
    onValueChange,
    submitFormatted = false,
    formatOn = 'input',
    rejectedLabel,
    name,
    inputmode,
    autocomplete,
    onkeydown,
    onbeforeinput,
    onblur,
    ...rest
  }: Props = $props();

  const preset = $derived<MaskPreset>(
    typeof mask === 'object' ? mask : { mask },
  );
  const kind = $derived(slotKind(patternFor(preset.mask, value)));
  const rejectedText = $derived(
    rejectedLabel ??
      { digits: 'Numbers only', letters: 'Letters only', mixed: 'Letters and numbers only' }[kind],
  );

  let input: HTMLInputElement | undefined;
  let text = $state('');
  let status = $state('');

  const strip = (next: string): string => toRaw(next, preset.mask, preset.normalise);

  // Follow a value set from outside (and the first one).
  $effect.pre(() => {
    if (strip(text) !== value) text = format(value, preset.mask);
  });
  $effect.pre(() => {
    const next = format(value, preset.mask);
    if (formatted !== next) formatted = next;
  });

  const setRaw = (raw: string): void => {
    if (raw === value) return;
    value = raw;
    onValueChange?.(raw);
  };

  const placeCaret = async (caret: number): Promise<void> => {
    await tick();
    if (input !== undefined && document.activeElement === input) {
      input.setSelectionRange(caret, caret);
    }
  };

  /** Every edit: strip to raw, reformat, and put the caret back after the same raw characters. */
  const onText = (next: string): void => {
    const raw = strip(next);
    if (formatOn === 'blur') {
      text = next;
      setRaw(raw);
      return;
    }
    const caret = input?.selectionStart ?? next.length;
    const before = Math.min(rawBefore(next, caret, preset.mask), raw.length);
    text = format(raw, preset.mask);
    // Assigning the same string would not reach the input, so write it.
    if (input !== undefined) input.value = text;
    setRaw(raw);
    void placeCaret(caretAfter(text, before, preset.mask));
  };

  const deletions: Record<string, 'backward' | 'forward'> = {
    Backspace: 'backward',
    Delete: 'forward',
  };

  const keydown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }): void => {
    onkeydown?.(event);
    const direction = deletions[event.key];
    const { selectionStart, selectionEnd } = event.currentTarget;
    if (direction === undefined || formatOn === 'blur' || selectionStart !== selectionEnd) return;
    const edit = deleteAcrossLiteral(text, selectionStart ?? 0, direction, preset.mask);
    if (edit === undefined) return;
    event.preventDefault();
    text = format(edit.raw, preset.mask);
    event.currentTarget.value = text;
    setRaw(edit.raw);
    void placeCaret(edit.caret);
  };

  const wrongKind: Record<typeof kind, RegExp | undefined> = {
    digits: /^\p{L}$/u,
    letters: /^\d$/u,
    mixed: undefined,
  };

  const beforeinput = (event: InputEvent & { currentTarget: HTMLInputElement }): void => {
    onbeforeinput?.(event);
    if (event.inputType !== 'insertText' || event.data === null) return;
    status = wrongKind[kind]?.test(event.data) === true ? rejectedText : '';
  };

  const blur = (event: FocusEvent & { currentTarget: HTMLInputElement }): void => {
    onblur?.(event);
    if (formatOn === 'blur') text = format(value, preset.mask);
  };

  const capture = (node: HTMLInputElement): void => {
    input = node;
  };
</script>

<TextInput
  {...rest}
  type="text"
  bind:value={() => text, onText}
  inputmode={inputmode ?? preset.inputmode ?? (kind === 'digits' ? 'numeric' : undefined)}
  autocomplete={autocomplete ?? (preset.autocomplete as TextInputProps['autocomplete'])}
  onkeydown={keydown}
  onbeforeinput={beforeinput}
  onblur={blur}
  {@attach capture}
/>
<p role="status" class="sr-only">{status}</p>
{#if name !== undefined && value !== ''}
  <input type="hidden" {name} value={submitFormatted ? formatted : value} />
{/if}
