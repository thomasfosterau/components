<!-- @component
Capture a signature: draw it with a finger, pen or mouse, or type a name instead, the keyboard and screen-reader path.
-->
<!--
  Two modes in `Tabs`: Draw, an SVG pad (`role="img"`, not focusable, as
  there is no keyboard drawing), and Type, a text field previewed in a
  script face. Without `allowTyped` the field cannot be completed from a
  keyboard (WCAG 2.1.1), so development builds warn. Whether a typed name
  is a valid signature is the app's legal question.
-->
<script lang="ts">
  import { DEV } from 'esm-env';
  import type { HTMLAttributes } from 'svelte/elements';
  import Tabs from '../layout/Tabs.svelte';
  import SignatureDrawing from './SignatureDrawing.svelte';
  import {
    scriptFont,
    strokesToSvg,
    strokeWidths,
    typedToSvg,
    type SignatureStroke,
    type SignatureValue,
  } from './signature.ts';
  import TextInput from './TextInput.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
    /** The signature, or `undefined` while there is none. Bindable. */
    value?: SignatureValue | undefined;
    /** Called with the new signature, or `undefined` when it is cleared. */
    onValueChange?: ((value: SignatureValue | undefined) => void) | undefined;
    /**
     * Offer the typed alternative. Without it the field fails WCAG 2.1.1.
     * @defaultValue `true`
     */
    allowTyped?: boolean | undefined;
    /** Pre-fills the typed name. */
    suggestedName?: string | undefined;
    /** Posts the signature's SVG under this name. */
    name?: string | undefined;
    /**
     * The pad's width to height.
     * @defaultValue `3`
     */
    aspect?: 2 | 3 | 4 | undefined;
    /** @defaultValue `'md'` */
    strokeWidth?: keyof typeof strokeWidths | undefined;
    /** The whole control is unavailable. */
    disabled?: boolean | undefined;
    /**
     * The drawing area's accessible name.
     * @defaultValue `'Signature area'`
     */
    padLabel?: string | undefined;
    /** @defaultValue `'Clear'` */
    clearLabel?: string | undefined;
    /** @defaultValue `'Undo'` */
    undoLabel?: string | undefined;
    /** @defaultValue `'Draw'` */
    drawTabLabel?: string | undefined;
    /** @defaultValue `'Type'` */
    typeTabLabel?: string | undefined;
    /**
     * Names the tab list.
     * @defaultValue `'Signature method'`
     */
    modeLabel?: string | undefined;
    /**
     * The typed name's label.
     * @defaultValue `'Type your full name'`
     */
    typedLabel?: string | undefined;
    /**
     * The pad's status while empty.
     * @defaultValue `'Sign above'`
     */
    emptyLabel?: string | undefined;
    /**
     * The pad's status once drawn.
     * @defaultValue `'Signature drawn'`
     */
    drawnLabel?: string | undefined;
    /**
     * Points keyboard users at the Type tab, in the pad's description.
     * @defaultValue `'To sign without drawing, use the Type tab.'`
     */
    keyboardHint?: string | undefined;
    /**
     * Shown when the form is submitted without a signature while `required`.
     * @defaultValue `'Sign or type your name'`
     */
    requiredMessage?: string | undefined;
    /** `FieldControl`: the label's id; names the group. */
    labelId?: string | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` on the typed name. */
    invalid?: boolean | undefined;
    /** `FieldControl`: a signature is needed to submit the form. */
    required?: boolean | undefined;
  }

  let {
    value = $bindable(undefined),
    onValueChange,
    allowTyped = true,
    suggestedName = '',
    name,
    aspect = 3,
    strokeWidth = 'md',
    disabled = false,
    padLabel = 'Signature area',
    clearLabel = 'Clear',
    undoLabel = 'Undo',
    drawTabLabel = 'Draw',
    typeTabLabel = 'Type',
    modeLabel = 'Signature method',
    typedLabel = 'Type your full name',
    emptyLabel = 'Sign above',
    drawnLabel = 'Signature drawn',
    keyboardHint = 'To sign without drawing, use the Type tab.',
    requiredMessage = 'Sign or type your name',
    labelId,
    describedBy = '',
    invalid = false,
    required = false,
    id: idProp,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const id = $derived(idProp ?? uid);
  const statusId = `${uid}-status`;
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;
  const typedId = `${uid}-typed`;

  $effect(() => {
    if (DEV && !allowTyped) {
      console.warn(
        'SignaturePad: without allowTyped there is no keyboard way to sign (WCAG 2.1.1).',
      );
    }
  });

  let mode = $state('draw');
  let strokes: readonly SignatureStroke[] = $state.raw([]);
  // svelte-ignore state_referenced_locally
  let typedName = $state(suggestedName);
  let missing = $state(false);

  const width = $derived(strokeWidths[strokeWidth]);

  const compute = (): SignatureValue | undefined => {
    if (mode === 'type') {
      const trimmed = typedName.trim();
      return trimmed === ''
        ? undefined
        : { kind: 'typed', svg: typedToSvg(trimmed, { aspect }), typedName: trimmed };
    }
    return strokes.length === 0
      ? undefined
      : { kind: 'drawn', svg: strokesToSvg(strokes, { aspect, strokeWidth: width }) };
  };

  const update = (): void => {
    value = compute();
    if (value !== undefined) missing = false;
    onValueChange?.(value);
  };

  const tabs = $derived([
    { value: 'draw', label: drawTabLabel },
    { value: 'type', label: typeTabLabel },
  ]);
  const padDescription = $derived(
    [statusId, allowTyped ? hintId : ''].filter((part) => part !== '').join(' '),
  );
  const groupDescription = $derived(
    [describedBy, missing ? errorId : ''].filter((part) => part !== '').join(' '),
  );
</script>

{#snippet drawPanel()}
  <SignatureDrawing
    bind:strokes
    {aspect}
    strokeWidth={width}
    {padLabel}
    describedBy={padDescription}
    {undoLabel}
    {clearLabel}
    {disabled}
    onChange={update}
  />
  <p id={statusId} class="text-base-content/70 text-sm">
    {strokes.length === 0 ? emptyLabel : drawnLabel}
  </p>
  {#if allowTyped}<p id={hintId} class="sr-only">{keyboardHint}</p>{/if}
{/snippet}

{#snippet typePanel()}
  <div class="flex flex-col gap-2 pt-2">
    <label for={typedId} class="text-sm">{typedLabel}</label>
    <TextInput
      id={typedId}
      autocomplete="name"
      invalid={invalid || missing}
      {disabled}
      bind:value={() => typedName, (next: string) => {
        typedName = next;
        update();
      }}
    />
    <p
      aria-hidden="true"
      class="rounded-box border-base-300 bg-base-100 flex items-center justify-center overflow-hidden border text-4xl"
      style:aspect-ratio="{aspect} / 1"
      style:font-family={scriptFont}
    >
      {typedName}
    </p>
  </div>
{/snippet}

<div
  {...rest}
  {id}
  role="group"
  aria-labelledby={labelId}
  aria-describedby={groupDescription === '' ? undefined : groupDescription}
  class={['flex flex-col gap-2', className]}
>
  {#if allowTyped}
    <Tabs
      items={tabs}
      bind:value={() => mode, (next: string) => {
        mode = next;
        update();
      }}
      label={modeLabel}
    >
      {#snippet panel(item)}
        {#if item.value === 'draw'}{@render drawPanel()}{:else}{@render typePanel()}{/if}
      {/snippet}
    </Tabs>
  {:else}
    {@render drawPanel()}
  {/if}
  {#if missing}<p id={errorId} class="text-error text-sm">{requiredMessage}</p>{/if}
  {#if name !== undefined || required}
    <!-- Carries the value and the form's required check; the field above is what a reader uses. -->
    <input
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      name={name}
      value={value?.svg ?? ''}
      {required}
      oninvalid={(event) => {
        event.preventDefault();
        missing = true;
      }}
    />
  {/if}
</div>
