<!-- @component
A field that records a keyboard shortcut: focus it and press the keys. It rejects reserved combinations and, inside a hotkey registry, reports one already in use, offering to move it.
-->
<!--
  HotkeyInput — a read-only input that listens while focused. Tab and
  Shift+Tab always move on (no keyboard trap); Escape drops an unaccepted
  attempt; Backspace or Delete clears. The registry's dispatch is paused while
  it has focus, so recording K never runs K's command. The shortcut is shown
  with platform glyphs and described in words ("Command Shift K").
-->
<script lang="ts">
  import { X } from '@lucide/svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { inputSize, type FieldSize } from '../fields/field-types.ts';
  import IconButton from '../ui/IconButton.svelte';
  import VisuallyHidden from '../ui/VisuallyHidden.svelte';
  import { tryGetHotkeyRegistry } from './context.svelte.ts';
  import { isApplePlatform } from './match.ts';
  import {
    chordOf,
    defaultReservedHotkeys,
    hasModifier,
    shownChordNames,
    spokenChordNames,
    triggerText,
  } from './record.ts';
  import type { HotkeyBinding } from './registry.svelte.ts';
  import type { HotkeyChord, HotkeyTrigger } from './types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'value' | 'size' | 'onchange'> {
    /**
     * The shortcut, in registry syntax (`'$mod+shift+k'`); `undefined` for none. Bindable.
     * A sequence (`['g', 'p']`) is shown, but recording always makes a chord.
     */
    value?: HotkeyTrigger | undefined;
    /** Called with each accepted shortcut, or `undefined` when cleared. */
    onchange?: ((value: HotkeyChord | undefined) => void) | undefined;
    /**
     * Require Ctrl/⌘ or Alt, so a single key can't be recorded.
     * @defaultValue `true`
     */
    requireModifier?: boolean | undefined;
    /**
     * Combinations that can't be taken.
     * @defaultValue the browser's own (`$mod+w`, `$mod+t`, `$mod+l`…)
     */
    reserved?: readonly HotkeyChord[] | undefined;
    /** The registry action this field edits, so it is not its own conflict. */
    forId?: string | undefined;
    /**
     * Shown while empty.
     * @defaultValue `'Press a shortcut'`
     */
    recordingLabel?: string | undefined;
    /**
     * The clear button's name.
     * @defaultValue `'Clear shortcut'`
     */
    clearLabel?: string | undefined;
    /**
     * The field's keyboard instructions.
     * @defaultValue `'Press the keys for the shortcut. Press Backspace to clear, or Tab to keep the current shortcut.'`
     */
    instructionsLabel?: string | undefined;
    /**
     * The error for a shortcut already in use.
     * @defaultValue `` (command) => `Already used by ${command}` ``
     */
    conflictLabel?: ((command: string) => string) | undefined;
    /**
     * The button that takes the shortcut from the other command.
     * @defaultValue `'Replace'`
     */
    replaceLabel?: string | undefined;
    /**
     * The error for a reserved shortcut.
     * @defaultValue `'That shortcut belongs to the browser'`
     */
    reservedLabel?: string | undefined;
    /**
     * The error for a shortcut without a modifier.
     * @defaultValue `'Include Ctrl, ⌘ or Alt'`
     */
    modifierRequiredLabel?: string | undefined;
    /**
     * Joins the steps of a sequence.
     * @defaultValue `'then'`
     */
    thenLabel?: string | undefined;
    /**
     * Read when no shortcut is set.
     * @defaultValue `'No shortcut'`
     */
    noneLabel?: string | undefined;
    /**
     * Size.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** Ids of the field's description and errors. */
    describedBy?: string | undefined;
    /** The label's id; the field is named by `<label for>`, so this is accepted and unused. */
    labelId?: string | undefined;
    /**
     * Whether the value is invalid.
     * @defaultValue `false`
     */
    invalid?: boolean | undefined;
  }

  let {
    value = $bindable(),
    onchange,
    requireModifier = true,
    reserved = defaultReservedHotkeys,
    forId,
    recordingLabel = 'Press a shortcut',
    clearLabel = 'Clear shortcut',
    instructionsLabel = 'Press the keys for the shortcut. Press Backspace to clear, or Tab to keep the current shortcut.',
    conflictLabel = (command: string) => `Already used by ${command}`,
    replaceLabel = 'Replace',
    reservedLabel = 'That shortcut belongs to the browser',
    modifierRequiredLabel = 'Include Ctrl, ⌘ or Alt',
    noneLabel = 'No shortcut',
    thenLabel = 'then',
    size = 'md',
    describedBy = '',
    labelId: _labelId,
    invalid = false,
    disabled,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const instructionsId = `${uid}-instructions`;
  const spokenId = `${uid}-spoken`;
  const errorId = `${uid}-error`;
  const registry = tryGetHotkeyRegistry();

  let apple = $state(false);
  $effect(() => {
    apple = isApplePlatform();
  });

  /** A rejected attempt: why, and the command it clashes with if that is the reason. */
  let refusal = $state.raw<{ chord: HotkeyChord; message: string; clash?: HotkeyBinding } | undefined>();
  let resume: (() => void) | undefined;

  const shown = $derived(
    value === undefined ? '' : triggerText(value, shownChordNames(apple), apple ? '' : '+', thenLabel),
  );
  const spoken = $derived(
    value === undefined ? noneLabel : triggerText(value, spokenChordNames(apple), ' ', thenLabel),
  );
  const description = $derived(
    [instructionsId, spokenId, refusal && errorId, describedBy].filter(Boolean).join(' '),
  );

  const commit = (next: HotkeyChord | undefined): void => {
    refusal = undefined;
    value = next;
    onchange?.(next);
  };

  const check = (chord: HotkeyChord): typeof refusal => {
    if (requireModifier && !hasModifier(chord)) return { chord, message: modifierRequiredLabel };
    if (reserved.some((taken) => taken.toLowerCase() === chord.toLowerCase())) {
      return { chord, message: reservedLabel };
    }
    const clash = registry?.conflicts(chord, forId)[0];
    return clash ? { chord, message: conflictLabel(clash.label), clash } : undefined;
  };

  const record = (chord: HotkeyChord): void => {
    const problem = check(chord);
    if (problem) refusal = problem;
    else commit(chord);
  };

  const replace = (): void => {
    if (!refusal?.clash) return;
    registry?.setBinding(refusal.clash.id, null);
    commit(refusal.chord);
  };

  const plain = (event: KeyboardEvent): boolean =>
    !event.ctrlKey && !event.metaKey && !event.altKey;

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Tab' && plain(event)) return;
    event.preventDefault();
    if (event.key === 'Escape' && plain(event)) {
      refusal = undefined;
    } else if ((event.key === 'Backspace' || event.key === 'Delete') && plain(event) && !event.shiftKey) {
      commit(undefined);
    } else {
      const chord = chordOf(event, apple);
      if (chord !== undefined) record(chord);
    }
  };

  const onFocus = (): void => {
    resume?.();
    resume = registry?.pause();
  };

  const onBlur = (): void => {
    resume?.();
    resume = undefined;
  };

  $effect(() => () => resume?.());
</script>

{#snippet clearIcon()}<X class="size-4" />{/snippet}

<div class="flex flex-col gap-1">
  <div class="flex items-center gap-1">
    <input
      {...rest}
      type="text"
      readonly
      {disabled}
      value={shown}
      placeholder={recordingLabel}
      autocomplete="off"
      aria-invalid={invalid || refusal ? 'true' : undefined}
      aria-describedby={description}
      class={['input w-full font-mono', inputSize[size], (invalid || refusal) && 'input-error', className]}
      onkeydown={onKeydown}
      onfocus={onFocus}
      onblur={onBlur}
    />
    {#if value !== undefined && !disabled}
      <IconButton label={clearLabel} icon={clearIcon} size="sm" variant="ghost" onclick={() => commit(undefined)} />
    {:else}
      <!-- Holds the clear button's place, so the field keeps its width when emptied. -->
      <span class="btn btn-sm btn-square invisible" aria-hidden="true"></span>
    {/if}
  </div>
  <VisuallyHidden id={instructionsId}>{instructionsLabel}</VisuallyHidden>
  <VisuallyHidden id={spokenId}>{spoken}</VisuallyHidden>
  <div aria-live="polite">
    {#if refusal}
      <p id={errorId} class="text-error flex items-center gap-2 text-sm">
        {refusal.message}
        {#if refusal.clash}
          <button type="button" class="btn btn-xs btn-outline" onclick={replace}>{replaceLabel}</button>
        {/if}
      </p>
    {/if}
  </div>
</div>
