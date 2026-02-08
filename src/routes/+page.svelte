<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import CardContent from '$lib/components/CardContent.svelte';
	import CardDescription from '$lib/components/CardDescription.svelte';
	import CardHeader from '$lib/components/CardHeader.svelte';
	import CardTitle from '$lib/components/CardTitle.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Select from '$lib/components/Select.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';

	const selectItems = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'banana', label: 'Banana' },
		{ value: 'orange', label: 'Orange' },
		{ value: 'grape', label: 'Grape', disabled: true }
	];
</script>

<div class="container mx-auto p-8 max-w-6xl">
	<h1 class="text-4xl font-bold mb-2">Component Library Demo</h1>
	<p class="text-slate-600 mb-8">
		A collection of Svelte components styled with Tailwind CSS and built with Melt UI for
		accessibility
	</p>

	<div class="grid gap-8">
		<!-- Button Component -->
		<section>
			<h2 class="text-2xl font-semibold mb-4">Button Component</h2>
			<Card>
				<CardContent>
					<div class="space-y-4">
						<div>
							<h3 class="text-sm font-medium mb-2">Variants</h3>
							<div class="flex flex-wrap gap-2">
								<Button>Default</Button>
								<Button variant="secondary">Secondary</Button>
								<Button variant="outline">Outline</Button>
								<Button variant="ghost">Ghost</Button>
							</div>
						</div>
						<div>
							<h3 class="text-sm font-medium mb-2">Sizes</h3>
							<div class="flex flex-wrap items-center gap-2">
								<Button size="sm">Small</Button>
								<Button size="md">Medium</Button>
								<Button size="lg">Large</Button>
							</div>
						</div>
						<div>
							<h3 class="text-sm font-medium mb-2">States</h3>
							<div class="flex flex-wrap gap-2">
								<Button>Enabled</Button>
								<Button disabled>Disabled</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</section>

		<!-- Card Component -->
		<section>
			<h2 class="text-2xl font-semibold mb-4">Card Component</h2>
			<div class="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Card Title</CardTitle>
						<CardDescription>Card description goes here</CardDescription>
					</CardHeader>
					<CardContent>
						<p class="text-sm">
							This is a card component with header and content sections. It's fully customizable
							with Tailwind classes.
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
							Cards can be used for various purposes like displaying information, forms, or
							grouping related content.
						</p>
					</CardContent>
				</Card>
			</div>
		</section>

		<!-- Dialog Component -->
		<section>
			<h2 class="text-2xl font-semibold mb-4">Dialog Component</h2>
			<Card>
				<CardContent>
					<Dialog title="Example Dialog" description="This is an accessible dialog built with Melt UI">
						<p class="text-sm text-slate-700">
							Dialog content goes here. The dialog is fully accessible and can be closed by
							clicking outside or pressing escape.
						</p>
					</Dialog>
				</CardContent>
			</Card>
		</section>

		<!-- Select Component -->
		<section>
			<h2 class="text-2xl font-semibold mb-4">Select Component</h2>
			<Card>
				<CardContent>
					<div class="max-w-xs">
						<label for="fruit-select" class="block text-sm font-medium mb-2">Choose a fruit</label>
						<Select items={selectItems} placeholder="Select a fruit..." />
					</div>
				</CardContent>
			</Card>
		</section>

		<!-- Tooltip Component -->
		<section>
			<h2 class="text-2xl font-semibold mb-4">Tooltip Component</h2>
			<Card>
				<CardContent>
					<p class="text-sm">
						Hover over the{' '}
						<Tooltip text="This is a helpful tooltip!">
							<span class="underline decoration-dotted cursor-help">underlined text</span>
						</Tooltip>
						{' '}to see a tooltip.
					</p>
				</CardContent>
			</Card>
		</section>
	</div>
</div>
