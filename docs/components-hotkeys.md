# Hotkeys and the command palette

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

One registry answers "what can the viewer do right now"; `HotkeyProvider` matches keystrokes against it, `HotkeyHelpDialog` lists what carries a trigger, and `search`'s `CommandPalette` lists what is palette-visible. An app creates the registry in its root layout, renders `HotkeyProvider` once, and registers actions from anywhere below — global ones from the layout, page ones from the page, torn down on unmount.

The family is also its own entry, `@thomasfosterau/components/hotkeys`. Import `HotkeyHelpDialog` from it dynamically (`const { HotkeyHelpDialog } = await import('@thomasfosterau/components/hotkeys')`) to keep the dialog out of your entry chunk until the first `?`.

| Export | What it is |
| --- | --- |
| `createHotkeyRegistry(options: HotkeyRegistryOptions): HotkeyRegistry` | Creates the registry and puts it in context. Call once, from the root layout, during component initialisation. |
| `HotkeyRegistryOptions` | `{ isAdmin: () => boolean, dev?: boolean }`. `isAdmin` is a function, so the gate is reactive; with `dev` set, registering a trigger that shadows an existing one logs a console warning (wire it to your bundler's dev flag). |
| `getHotkeyRegistry()` / `tryGetHotkeyRegistry()` | Read it back; the first throws `HotkeyRegistryMissing` (an `Error` subclass) when no registry was created above, the second returns `undefined` instead — the seam `CommandPalette` uses to work with no registry. |
| `registerHotkeys(() => actions, { scope? })` | Declarative registration for the calling component's lifetime; `scope` defaults to `'page'`. The thunk is reactive: when what it reads changes, the batch is replaced. |
| `HotkeyRegistry` | The class `createHotkeyRegistry` returns. `paletteOpen` and `helpOpen` are writable `$state` flags (what a palette or help action toggles); `active` (role-filtered, match-precedence order: page before global, later registrations first), `paletteActions` (palette-visible, registration order) and `hotkeys` (those with a trigger, registration order) are read-only `RegisteredAction[]`s; `register(scope, actions)` returns its unregister function. An action with `requiresAdmin` is absent from all three for a viewer `isAdmin()` rejects. |
| `CommandAction` | One registered action: `{ id, label, group: CommandActionGroup, run: () => void \| Promise<void>, trigger?: HotkeyTrigger, requiresAdmin?, paletteVisible?, allowInEditable? }`. No `trigger` makes it palette-only; `paletteVisible: false` makes it hotkey-only; `allowInEditable` lets it fire while focus is in an input (reserve it for the palette opener). |
| `CommandActionGroup` | `'actions' \| 'navigation'` — the palette section an action is listed under. |
| `HotkeyScope` | `'global' \| 'page'`. Page registrations are torn down with their page and win trigger conflicts over global ones. |
| `RegisteredAction` | `{ scope, action }` — what the registry's read surfaces return. |
| `HotkeyTrigger` | `HotkeyChord \| HotkeySequence`. A **chord** (`HotkeyChord`, a string such as `'$mod+k'`) is `+`-separated modifiers (`$mod`, `alt`, `shift`) and a key held together, `$mod` being ⌘ on Apple platforms and Ctrl elsewhere; a **sequence** (`HotkeySequence`, `readonly string[]` such as `['g', 'p']`) is plain keys pressed in order, buffered for `SEQUENCE_TIMEOUT_MS` (1000). A string without `+` (`'e'`, `'?'`) is a one-key sequence. Shift is never written for a shifted character: `'?'` already arrives as `?`. |

The matching rules `HotkeyProvider` runs are exported as pure functions, for a caller building its own listener or testing its triggers:

| Function | What it does |
| --- | --- |
| `matchChord(event, actions): CommandAction \| undefined` | The first action whose chord trigger matches the event. `actions` must already be in precedence order (`registry.active` is). The other platform's modifier must not be held, so Ctrl+K on a Mac does not fire `$mod+k`. |
| `matchSequence(buffer, actions): SequenceMatch` | Matches a buffer of keys against every plain-key trigger. `SequenceMatch` is `{ exact: CommandAction \| undefined, isPrefix: boolean }` — the first action the buffer completes, and whether the buffer could still grow into a longer sequence. |
| `isSequenceKey(event): boolean` | Whether the key can join a sequence: one printable character, no ⌘ / Ctrl / Alt. |
| `hasChordModifier(event): boolean` | Whether ⌘, Ctrl or Alt is held. |
| `isEditableTarget(target): boolean` | Whether the target is an `input`, `textarea`, `select` or contenteditable element — where only `allowInEditable` actions fire. |
| `isApplePlatform(): boolean` | Whether `$mod` means ⌘ here (`navigator.platform` is a Mac or iOS device); `false` where there is no `navigator`. |
| `ariaKeyShortcuts(trigger): string \| undefined` | The trigger in `aria-keyshortcuts` syntax (`'Control+Shift+K'`, `'?'`), with `$mod` as `Meta` on Apple platforms and `Control` elsewhere; `undefined` for a sequence, which the attribute cannot express. `MenuItem`'s `hotkey` uses it. |
| `triggerDisplay(trigger): TriggerDisplay` | The trigger as `HotkeyBadge` renders it: `TriggerDisplay` is `{ keys: readonly string[], sequential: boolean }`, keys upper-cased except `'$mod'`, which is left for the renderer to resolve per platform. |

```svelte
<!-- Root layout, once. -->
<script lang="ts">
  import { createHotkeyRegistry, registerHotkeys, HotkeyProvider, HotkeyHelpDialog, CommandPalette } from '@thomasfosterau/components';

  const hotkeys = createHotkeyRegistry({ isAdmin: () => user?.isAdmin === true, dev });
  registerHotkeys(() => [
    { id: 'palette.toggle', label: 'Open the command palette', group: 'actions', trigger: '$mod+k', allowInEditable: true, paletteVisible: false, run: () => { hotkeys.paletteOpen = !hotkeys.paletteOpen; } },
    { id: 'help.toggle', label: 'Show keyboard shortcuts', group: 'actions', trigger: '?', run: () => { hotkeys.helpOpen = !hotkeys.helpOpen; } },
    { id: 'nav.plants', label: 'Go to plants', group: 'navigation', trigger: ['g', 'p'], run: () => goto('/plants') },
  ], { scope: 'global' });
</script>

<HotkeyProvider />
<HotkeyHelpDialog />
<CommandPalette />
```

```svelte
<!-- A page, contributing its own actions for as long as it is mounted. -->
<script lang="ts">
  import { registerHotkeys } from '@thomasfosterau/components';
  registerHotkeys(() => bed.canEdit ? [{ id: 'bed.edit', label: 'Edit this bed', group: 'actions', trigger: 'e', run: () => goto(`/beds/${bed.id}/edit`) }] : []);
</script>
```

## Command palette

One component, because a palette is one thing: a dialog, a query box, and rows from wherever the app has them. It composes this library's `Dialog` with bits-ui's `Command`, taking rows from up to three places at once — a mounted hotkey registry's `paletteActions`, a static `items` prop, and an asynchronous `onSearch` — none required.

`onSearch` follows the same debounce / latest-wins (`AbortController`) / stale-while-revalidate rules as `fields/Combobox`. `CommandItem` is `{ id, label, group, hint?, badge?, run?, href? }`; activation closes the palette, calls `onSelect`, then `run`, then navigates to `href` through the components context. A row's `group` names a `CommandGroup` — `{ id, label }`, a section and its heading — and `groups` sets which sections render, in order; a row whose `group` is not listed there is not shown. `defaultCommandGroups` is `[{ id: 'actions', label: 'Actions' }, { id: 'navigation', label: 'Go to' }, { id: 'results', label: 'Results' }]`: the registry's two `CommandActionGroup`s, then a `results` section for `onSearch` rows. Pass your own array to rename or translate the headings.

```svelte
<!-- With a hotkey registry mounted, no props are needed at all. -->
<CommandPalette />
```

```svelte
<script lang="ts">
  import { CommandPalette, type CommandItem } from '@thomasfosterau/components';

  const items: readonly CommandItem[] = [
    { id: 'bed.create', label: 'New bed', group: 'actions', run: () => goto('/beds/new') },
  ];
  const onSearch = async (query: string, signal: AbortSignal): Promise<readonly CommandItem[]> => {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
    return (await response.json()).map((row) => ({ id: row.id, label: row.name, group: 'results', href: `/plants/${row.id}` }));
  };
</script>

<CommandPalette bind:open {items} {onSearch} />
```
