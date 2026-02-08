# @thomasfosterau/components

A collection of accessible, customizable Svelte components styled with Tailwind CSS and built with Melt UI.

## Features

- 🎨 **Styled with Tailwind CSS** - Beautiful default styles that are fully customizable
- ♿ **Accessible by default** - Built with Melt UI for WCAG compliance
- 🔧 **Highly customizable** - Override any class with your own Tailwind classes
- 📦 **Tree-shakeable** - Only bundle the components you use
- 🎯 **TypeScript support** - Full type definitions included

## Installation

```bash
npm install @thomasfosterau/components
```

### Prerequisites

This library requires the following peer dependencies:

- `svelte` ^4.0.0
- `tailwindcss` ^3.0.0

You'll also need to configure Tailwind CSS in your project. Add this library's path to your `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/@thomasfosterau/components/**/*.{svelte,js,ts}'
  ],
  // ... rest of your config
}
```

## Components

### Button

A versatile button component with multiple variants and sizes.

```svelte
<script>
  import { Button } from '@thomasfosterau/components';
</script>

<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

<Button disabled>Disabled</Button>
<Button class="bg-blue-500 hover:bg-blue-600">Custom styles</Button>
```

**Props:**
- `variant`: `'default' | 'secondary' | 'outline' | 'ghost'` (default: `'default'`)
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `disabled`: `boolean` (default: `false`)
- `type`: `'button' | 'submit' | 'reset'` (default: `'button'`)
- `class`: `string` - Override or extend default classes

### Card

A card component with optional header, title, description, and content sections.

```svelte
<script>
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@thomasfosterau/components';
</script>

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Your content here
  </CardContent>
</Card>
```

### Dialog

An accessible modal dialog built with Melt UI.

```svelte
<script>
  import { Dialog } from '@thomasfosterau/components';
</script>

<Dialog 
  title="Dialog Title" 
  description="Optional description"
>
  Dialog content goes here
</Dialog>
```

**Props:**
- `open`: `boolean` - Control dialog visibility
- `title`: `string` - Dialog title
- `description`: `string` - Optional description
- `overlayClass`: `string` - Override overlay classes
- `contentClass`: `string` - Override content classes
- `titleClass`: `string` - Override title classes
- `descriptionClass`: `string` - Override description classes

### Select

A dropdown select component with keyboard navigation and accessibility.

```svelte
<script>
  import { Select } from '@thomasfosterau/components';

  const items = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' }
  ];

  let selected;
</script>

<Select {items} bind:selected placeholder="Choose an option..." />
```

**Props:**
- `items`: `Array<{ value: string, label: string, disabled?: boolean }>` - Options to display
- `selected`: `Item | undefined` - Currently selected item
- `placeholder`: `string` - Placeholder text
- `triggerClass`: `string` - Override trigger button classes
- `contentClass`: `string` - Override dropdown menu classes
- `itemClass`: `string` - Override item classes

### Tooltip

A tooltip component that appears on hover.

```svelte
<script>
  import { Tooltip } from '@thomasfosterau/components';
</script>

<Tooltip text="Helpful tooltip text">
  <span>Hover over me</span>
</Tooltip>
```

**Props:**
- `text`: `string` - Tooltip content
- `triggerClass`: `string` - Override trigger classes
- `contentClass`: `string` - Override tooltip classes

## Customization

All components support class overrides through the `class` prop (or specific class props for complex components). You can:

1. **Extend default styles**: Add new classes alongside defaults
2. **Override specific styles**: Use Tailwind's utility classes to override defaults
3. **Complete custom styling**: Pass entirely custom class strings

Example:

```svelte
<!-- Extend with additional spacing -->
<Button class="px-8">Wide Button</Button>

<!-- Override colors completely -->
<Button class="bg-purple-500 hover:bg-purple-600 text-white">Custom Color</Button>

<!-- Card with custom background -->
<Card class="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
  <CardContent>Custom styled card</CardContent>
</Card>
```

## Development

```bash
# Install dependencies
npm install

# Start dev server with demo
npm run dev

# Build the library
npm run build

# Type checking
npm run check
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
