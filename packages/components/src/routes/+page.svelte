<script lang="ts">
  import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Dialog,
    Select,
    Tooltip,
    type SelectItem
  } from '#lib/index.js';

  const selectItems: SelectItem[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
    { value: 'grape', label: 'Grape', disabled: true }
  ];

  let fruit = $state<string | undefined>(undefined);
  let dialogOpen = $state(false);
  let clicks = $state(0);
</script>

<div class="container mx-auto max-w-6xl p-8">
  <h1 class="mb-2 text-4xl font-bold">Component Library Demo</h1>
  <p class="mb-8 text-slate-600">
    Svelte 5 components styled with Tailwind CSS and built on Melt UI for accessibility
  </p>

  <div class="grid gap-8">
    <section>
      <h2 class="mb-4 text-2xl font-semibold">Button</h2>
      <Card>
        <CardContent>
          <div class="space-y-4">
            <div>
              <h3 class="mb-2 text-sm font-medium">Variants</h3>
              <div class="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
            <div>
              <h3 class="mb-2 text-sm font-medium">Sizes</h3>
              <div class="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div>
              <h3 class="mb-2 text-sm font-medium">States</h3>
              <div class="flex flex-wrap items-center gap-2">
                <Button onclick={() => clicks++}>Clicked {clicks} times</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    <section>
      <h2 class="mb-4 text-2xl font-semibold">Card</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm">
              A card with header and content sections, fully customizable with Tailwind classes.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Another Card</CardTitle>
            <CardDescription>With different content</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-sm">
              Cards group related content — information, forms, or anything else.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-2xl font-semibold">Dialog</h2>
      <Card>
        <CardContent>
          <Dialog
            bind:open={dialogOpen}
            title="Example Dialog"
            description="An accessible dialog built on Melt UI"
            triggerLabel="Open dialog"
          >
            <p class="text-sm text-slate-700">
              Dialog content goes here. Close it by clicking outside or pressing Escape.
            </p>
          </Dialog>
          <p class="mt-4 text-sm text-slate-600">Open: {dialogOpen}</p>
        </CardContent>
      </Card>
    </section>

    <section>
      <h2 class="mb-4 text-2xl font-semibold">Select</h2>
      <Card>
        <CardContent>
          <div class="max-w-xs">
            <p class="mb-2 text-sm font-medium">Choose a fruit</p>
            <Select items={selectItems} bind:value={fruit} placeholder="Select a fruit..." />
            <p class="mt-4 text-sm text-slate-600">Selected: {fruit ?? 'none'}</p>
          </div>
        </CardContent>
      </Card>
    </section>

    <section>
      <h2 class="mb-4 text-2xl font-semibold">Tooltip</h2>
      <Card>
        <CardContent>
          <p class="text-sm">
            Hover over the
            <Tooltip text="This is a helpful tooltip!">
              <span class="cursor-help underline decoration-dotted">underlined text</span>
            </Tooltip>
            to see a tooltip.
          </p>
        </CardContent>
      </Card>
    </section>
  </div>
</div>
