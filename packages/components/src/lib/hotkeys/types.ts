/**
 * The registration contract shared by the hotkey registry and the command
 * palette.
 *
 * A {@link CommandAction} is the unit of both systems: a labelled, runnable
 * action that may carry a keyboard trigger (making it a hotkey) and may
 * appear in the command palette (making it discoverable). Pages and the
 * global shell register actions through the registry; the palette and the
 * help overlay read the same registrations back, so there is exactly one
 * source of truth for "what can the viewer do right now".
 *
 * Every optional member is declared `T | undefined`: the workspace compiles
 * with `exactOptionalPropertyTypes`, and these objects are written as plain
 * literals by application code that forwards its own optional values.
 *
 * @module
 */

/**
 * A single-keystroke trigger.
 *
 * Grammar: zero or more `+`-separated modifiers followed by a key, e.g.
 * `'$mod+k'`, `'/'`, `'?'`, `'e'`. `$mod` resolves to ⌘ on macOS and Ctrl
 * elsewhere. Shift is never written explicitly — shifted characters (like
 * `?`) already arrive shifted in `KeyboardEvent.key`.
 */
export type HotkeyChord = string;

/**
 * A multi-keystroke trigger pressed in order, e.g. `['g', 'p']`. Only plain
 * (unmodified) printable keys participate in sequences.
 */
export type HotkeySequence = readonly string[];

export type HotkeyTrigger = HotkeyChord | HotkeySequence;

/** Palette grouping. Drives section headings and ordering. */
export type CommandActionGroup = 'actions' | 'navigation';

/**
 * Where a registration lives. Page registrations are torn down when the
 * registering page unmounts and win over global registrations on trigger
 * conflicts.
 */
export type HotkeyScope = 'global' | 'page';

export interface CommandAction {
  /** Stable unique id, e.g. `'nav.posts'`, `'posts.create'`. */
  id: string;
  /** Human-readable label. An i18n app resolves its message at registration. */
  label: string;
  /** What runs on activation (navigate, focus, open a dialog, …). */
  run: () => void | Promise<void>;
  /** Palette section. */
  group: CommandActionGroup;
  /** Optional keyboard trigger. Actions without one are palette-only. */
  trigger?: HotkeyTrigger | undefined;
  /**
   * When true the registry drops the action entirely for non-admin viewers —
   * it neither fires as a hotkey nor appears in the palette.
   */
  requiresAdmin?: boolean | undefined;
  /** Set false to keep an action hotkey-only (hidden from the palette). */
  paletteVisible?: boolean | undefined;
  /**
   * Allow the trigger to fire while focus is inside an editable element
   * (input / textarea / contenteditable). Reserved for the palette opener;
   * everything else stays inert while typing.
   */
  allowInEditable?: boolean | undefined;
}

/** A registration entry: an action plus the scope it was registered under. */
export interface RegisteredAction {
  scope: HotkeyScope;
  action: CommandAction;
}
