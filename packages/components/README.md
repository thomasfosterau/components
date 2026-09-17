# @thomasfosterau/components

Accessible, customizable Svelte 5 components styled with Tailwind CSS 4 and
built on [Melt UI](https://next.melt-ui.com).

## Features

- 🎨 **Styled with Tailwind CSS 4** — sensible defaults, every class overridable
- ♿ **Accessible by default** — Melt UI handles focus, keyboard and ARIA
- 🧩 **Runes and snippets** — written for Svelte 5, no legacy APIs
- 📦 **Tree-shakeable** — only bundle the components you use
- 🎯 **Typed** — full type definitions, including component props

## Installation

```bash
npm install @thomasfosterau/components
```

### Prerequisites

- `svelte` `^5.30.1`
- `tailwindcss` `^4.0.0`

Tailwind 4 has no `tailwind.config.js`, so point it at this package from your
CSS entry instead:

```css
@import 'tailwindcss';
@source '../node_modules/@thomasfosterau/components/dist';
```

If you would rather ship the library's pre-compiled stylesheet, import
`@thomasfosterau/components/styles.css` instead.

## Components

### Button

```svelte
<script lang="ts">
  import { Button } from '@thomasfosterau/components';

  let count = $state(0);
</script>

<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

<Button disabled>Disabled</Button>
<Button onclick={() => count++}>Clicked {count} times</Button>
<Button class="bg-blue-500 hover:bg-blue-600">Custom styles</Button>
```

**Props:** every `<button>` attribute, plus

- `variant`: `'default' | 'secondary' | 'outline' | 'ghost'` — default `'default'`
- `size`: `'sm' | 'md' | 'lg'` — default `'md'`
- `class`: `string` — appended to the default classes

### Card

```svelte
<script lang="ts">
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
  } from '@thomasfosterau/components';
</script>

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>Your content here</CardContent>
</Card>
```

Each card part takes the attributes of the element it renders (`div`, `div`,
`h3`, `p`, `div` respectively) plus a `class` prop.

### Dialog

Renders a native `<dialog>` opened with `showModal()`, so it gets the top layer,
focus trapping and Escape handling from the platform.

```svelte
<script lang="ts">
  import { Dialog, Button } from '@thomasfosterau/components';

  let open = $state(false);
</script>

<Dialog bind:open title="Dialog Title" description="Optional description">
  Dialog content goes here
</Dialog>
```

Bring your own trigger and footer with snippets:

```svelte
<Dialog bind:open title="Delete project">
  {#snippet trigger(attrs)}
    <Button variant="outline" {...attrs}>Delete…</Button>
  {/snippet}

  This cannot be undone.

  {#snippet footer(close)}
    <Button variant="outline" onclick={close}>Cancel</Button>
    <Button onclick={() => { remove(); close(); }}>Delete</Button>
  {/snippet}
</Dialog>
```

**Props:**

- `open`: `boolean` — bindable
- `title`, `description`: `string`
- `triggerLabel`: `string` — label for the built-in trigger; ignored when the `trigger` snippet is given
- `trigger`: `Snippet<[attrs]>` — spread `attrs` onto your own trigger element
- `footer`: `Snippet<[close]>` — replaces the built-in Close button
- `triggerClass`, `overlayClass`, `contentClass`, `titleClass`, `descriptionClass`: `string`

### Select

```svelte
<script lang="ts">
  import { Select, type SelectItem } from '@thomasfosterau/components';

  const items: SelectItem[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'grape', label: 'Grape', disabled: true }
  ];

  let value = $state<string | undefined>(undefined);
</script>

<Select {items} bind:value placeholder="Choose an option…" label="Fruit" />
```

**Props:**

- `items`: `SelectItem[]` — `{ value, label, disabled? }`
- `value`: `string | undefined` — bindable, the selected item's `value`
- `placeholder`: `string`
- `label`: `string` — accessible name for the trigger
- `triggerClass`, `contentClass`, `itemClass`: `string`

### Tooltip

```svelte
<script lang="ts">
  import { Tooltip } from '@thomasfosterau/components';
</script>

<Tooltip text="Helpful tooltip text" placement="top">
  <span>Hover over me</span>
</Tooltip>
```

**Props:**

- `text`: `string` — tooltip body; ignored when the `content` snippet is given
- `content`: `Snippet` — rich tooltip body
- `placement`: `'top' | 'right' | 'bottom' | 'left'` — default `'top'`
- `openDelay`, `closeDelay`: `number` — milliseconds, both default `0`
- `triggerClass`, `contentClass`: `string`

## Customization

Every component appends your `class` (or `*Class`) prop after its own classes,
so Tailwind's later-wins ordering lets you override anything:

```svelte
<Button class="px-8">Wide Button</Button>
<Button class="bg-purple-500 text-white hover:bg-purple-600">Custom Color</Button>

<Card class="border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
  <CardContent>Custom styled card</CardContent>
</Card>
```

## Development

Run these from the repository root, or from this directory:

```bash
npm run dev     # demo app on http://localhost:5173
npm run build   # svelte-package → dist/
npm run check   # svelte-check
```

SvelteKit 3 has no `svelte.config.js`: configuration lives in the `sveltekit()`
plugin call in `vite.config.ts`, and `$lib` is replaced by the `#lib/*` subpath
import declared in `package.json`.

## License

MIT
