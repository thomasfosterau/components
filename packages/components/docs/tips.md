# Tips

Each component's props, defaults, snippets and ARIA contract are in its doc comments, so they show on hover in your editor and in the generated `.d.ts`; this guide covers what a doc comment cannot: how the family fits together, which component to choose, and worked examples.

`@thomasfosterau/components/tips`. TipKit — contextual, dismissible guidance: an inline tip, a tip anchored to its trigger, the store that decides when either may show, and the stack that decides which one Escape closes.

| Export | What it is |
| --- | --- |
| `createTipStore(options?: TipStoreOptions): TipStore` | The store. `TipStoreOptions` is `{ storage?: TipStorage, prefix? = 'tips:' }`; `storage` defaults to `browserTipStorage()`. Call once, high in the tree. |
| `TipStore` | `register(config)` (re-registering an id replaces its config), `shouldDisplay(id)`, `getState(id)`, `markShown(id)`, `dismiss(id)`, `complete(id)`, `resetAll()`. An unregistered id never displays. |
| `TipStorage` | `{ getItem, setItem, removeItem }` — the subset of the DOM `Storage` interface the store needs, so `localStorage` satisfies it and a test can pass a plain object. Every access is guarded; a refusing storage only costs persistence. |
| `browserTipStorage()` / `memoryTipStorage()` | `localStorage` where it exists and accepts a write, else in-memory; and always in-memory (for tests and stories). |
| `createTipStack(): TipStack` / `soloTipStack` | `TipStack` is `{ push, pop, isTopmost }` — which tips are on screen, most recent last, so Escape closes only the topmost. `soloTipStack` always answers "topmost", the default when a tip gets no `stack`. |
| `TipConfig` | A tip as declared: `{ id, title, message?, actions?: TipAction[], rules?: TipRule[], frequency?: TipFrequency, maxDisplayCount? }`. |
| `TipAction` | A button on the tip: `{ id, title, handler: () => void \| Promise<void> }`. Taking one awaits `handler`, then **completes** the tip. |
| `TipRule` | `{ id, evaluate: () => boolean }`; every rule must hold for the tip to show. Synchronous on purpose — await your data first, then register the tip. |
| `TipFrequency` | `'immediate' \| 'hourly' \| 'daily' \| 'weekly' \| 'once'` (default `'immediate'`): how soon a tip may reappear after it was last shown. |
| `TipStatus` | `'pending' \| 'available' \| 'dismissed' \| 'completed'`. `dismissed` and `completed` are both terminal — `shouldDisplay` checks status before frequency, so neither shows again, even at `'immediate'`. |
| `TipState` | What is persisted per tip: `{ id, status, displayCount, lastShown?, dismissedAt?, completedAt? }` (ISO 8601 timestamps). |
| `TipPlacement` | `'top' \| 'bottom' \| 'left' \| 'right'` — `PopoverTip`'s `placement`. |

```ts
import { createTipStore } from '@thomasfosterau/components/tips';

const store = createTipStore({ prefix: 'myapp:tips:' }); // storage defaults to browserTipStorage()
store.register({
  id: 'welcome',
  title: 'Welcome',
  message: 'Track what you grow.',
  frequency: 'once',
});
```

```svelte
<script lang="ts">
  import { Tip, PopoverTip, createTipStore } from '@thomasfosterau/components/tips';
  const store = createTipStore();
  store.register({ id: 'welcome', title: 'Welcome', message: 'Track what you grow.' });
</script>

<Tip config={{ id: 'welcome', title: 'Welcome', message: 'Track what you grow.' }} {store} />

<PopoverTip config={{ id: 'search', title: 'Search across everything', message: 'One box, everything.' }} {store} placement="bottom">
  <button type="button" class="btn btn-primary">Search</button>
</PopoverTip>
```

`open` on `PopoverTip` is derived purely from the store's own state; the trigger never toggles it by clicking. Escape is arbitrated by a shared `TipStack` (`createTipStack()`), so two `PopoverTip`s on one page close in "last shown, first closed" order — pass the same `stack` to both.
