<!--
  HotkeyProvider — the single global `keydown` listener that drives the hotkey
  registry. Owns the sequence buffer (for `g p`-style triggers) and enforces
  the editable-target guard, so hotkeys never fire while the reader is typing
  in a form field or a rich-text editor.

  Render once, from the root layout, inside the component that called
  `createHotkeyRegistry()`. It renders nothing.

  ARIA contract: none of its own — it has no markup. What it owes assistive
  technology is negative: it must never steal a keystroke from a control that
  needs it, which is what the editable-target guard and the
  "`paletteOpen` / `helpOpen` suppress everything but `allowInEditable`" rule
  are for. bits-ui owns keyboard interaction inside its own dialogs.

  Not on a bits-ui primitive because there is no primitive for this: it is a
  document-level key router over an app-owned registry, not a widget.
-->
<script lang="ts">
  import { getHotkeyRegistry } from './context.svelte.ts';
  import {
    SEQUENCE_TIMEOUT_MS,
    hasChordModifier,
    isEditableTarget,
    isSequenceKey,
    matchChord,
    matchSequence,
    type SequenceMatch,
  } from './match.ts';
  import type { CommandAction } from './types.ts';

  const registry = getHotkeyRegistry();

  let sequenceBuffer: string[] = [];
  let sequenceTimer: ReturnType<typeof setTimeout> | undefined;

  function clearSequence(): void {
    sequenceBuffer = [];
    if (sequenceTimer !== undefined) clearTimeout(sequenceTimer);
    sequenceTimer = undefined;
  }

  function armSequenceTimeout(): void {
    if (sequenceTimer !== undefined) clearTimeout(sequenceTimer);
    sequenceTimer = setTimeout(clearSequence, SEQUENCE_TIMEOUT_MS);
  }

  function activate(action: CommandAction, event: KeyboardEvent): void {
    event.preventDefault();
    clearSequence();
    void action.run();
  }

  // The keyboard event router. The chord / sequence / suppression branching is
  // inherently branchy; splitting it would scatter the buffer state machine
  // across helpers and hurt readability more than the branch count does.
  function onKeydown(event: KeyboardEvent): void {
    // While a hotkey-owned dialog is open, or focus sits in an editable
    // element, only `allowInEditable` actions (the palette toggle) may fire —
    // bits-ui owns keyboard interaction inside its dialogs, and typing must
    // never trigger actions.
    const suppressed =
      registry.paletteOpen || registry.helpOpen || isEditableTarget(event.target);
    const actions = suppressed
      ? registry.active.filter((entry) => entry.action.allowInEditable)
      : registry.active;

    if (hasChordModifier(event)) {
      const action = matchChord(event, actions);
      if (action !== undefined) activate(action, event);
      return;
    }

    // Plain keys: ignore non-printable keys (Escape, arrows, bare modifiers,
    // F-keys) entirely — they neither fire nor disturb a pending sequence.
    if (!isSequenceKey(event)) return;

    if (suppressed) {
      clearSequence();
      return;
    }

    // Try extending the pending sequence first, then restarting from this key
    // alone, so a stray prefix never swallows a fresh trigger.
    let hit: { candidate: string[]; match: SequenceMatch } | undefined;
    for (const candidate of [[...sequenceBuffer, event.key], [event.key]]) {
      const match = matchSequence(candidate, actions);
      if (match.exact !== undefined || match.isPrefix) {
        hit = { candidate, match };
        break;
      }
    }

    if (hit === undefined) {
      clearSequence();
      return;
    }
    if (hit.match.exact !== undefined) {
      activate(hit.match.exact, event);
      return;
    }
    sequenceBuffer = hit.candidate;
    armSequenceTimeout();
  }

  $effect(() => () => {
    if (sequenceTimer !== undefined) clearTimeout(sequenceTimer);
  });
</script>

<svelte:window onkeydown={onKeydown} />
