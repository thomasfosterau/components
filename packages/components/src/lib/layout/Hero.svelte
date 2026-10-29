<!-- @component
The large introductory block at the top of a landing or "about" page: a headline, supporting copy, calls to action, and an optional figure or background image, in daisyUI's `hero` styles.
-->
<!--
  Hero — daisyUI's `hero` as a component: the top of a landing, marketing or
  "about" page, where `PageHeader` is the top of an app page. It takes
  arbitrary `children` rather than facts, which is why it is not a
  `PageHeader` variant.

  ARIA contract: the root is a `<section>` `aria-labelledby` its heading, so
  it is a named region in the landmark list. The headline is a real heading
  at `headingLevel`, `1` by default because a hero is normally the page's
  title — a page with a `Hero` should not also render a `PageHeader` `<h1>`.
  `actions` is a `role="group"` named by `actionsLabel`.

  `backgroundImage` is decorative by definition, so it is a CSS
  `background-image`, not an `<img>`: nothing enters the accessibility tree.
  The copy over it sits on `hero-overlay` in `text-neutral-content`, so the
  text keeps its contrast whatever the photo (WCAG 1.4.3). An image that
  carries meaning belongs in `figure`, with alt text.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HeadingLevel } from '../ui/tones.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
    /** The headline: text, or a snippet for richer markup. */
    title: string | Snippet<[]>;
    /**
     * The headline's level.
     * @defaultValue `1`
     */
    headingLevel?: HeadingLevel | undefined;
    /** Supporting copy under the headline. */
    description?: string | Snippet<[]> | undefined;
    /** The call-to-action row (`LinkButton`s), a group named by `actionsLabel`. */
    actions?: Snippet<[]> | undefined;
    /**
     * Accessible name of the `actions` group.
     * @defaultValue `'Actions'`
     */
    actionsLabel?: string | undefined;
    /** A figure beside the copy; stacks under it on a phone. */
    figure?: Snippet<[]> | undefined;
    /**
     * Where the copy aligns.
     * @defaultValue `'start'` with a `figure`, `'center'` without
     */
    align?: 'start' | 'center' | undefined;
    /** A decorative background image URL; the copy then sits on `hero-overlay` for contrast. */
    backgroundImage?: string | undefined;
    /** Extra content under the actions. */
    children?: Snippet<[]> | undefined;
  }

  let {
    title,
    headingLevel = 1,
    description,
    actions,
    actionsLabel = 'Actions',
    figure,
    align,
    backgroundImage,
    children,
    class: className,
    style,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const headingId = `${uid}-heading`;
  const centred = $derived((align ?? (figure === undefined ? 'center' : 'start')) === 'center');
  const overlaid = $derived(backgroundImage !== undefined);
  // `JSON.stringify` quotes the URL, so a value with parentheses or spaces
  // cannot break out of `url(...)`.
  const background = $derived(
    backgroundImage === undefined ? undefined : `background-image: url(${JSON.stringify(backgroundImage)});`,
  );
</script>

{#snippet text(value: string | Snippet<[]>)}
  {#if typeof value === 'string'}{value}{:else}{@render value()}{/if}
{/snippet}

<section
  {...rest}
  aria-labelledby={headingId}
  style={[background, style].filter(Boolean).join(' ') || undefined}
  class={['hero min-h-[50vh]', overlaid ? 'bg-cover bg-center' : 'bg-base-200', className]}
>
  {#if overlaid}
    <div class="hero-overlay bg-neutral/60"></div>
  {/if}
  <div
    class={[
      'hero-content gap-8',
      figure !== undefined && 'flex-col lg:flex-row',
      centred && 'text-center',
      overlaid && 'text-neutral-content',
    ]}
  >
    <div class={['max-w-2xl space-y-5', centred && 'mx-auto']}>
      <svelte:element
        this={`h${headingLevel}`}
        id={headingId}
        class="text-4xl font-bold tracking-tight text-balance sm:text-5xl"
      >
        {@render text(title)}
      </svelte:element>
      {#if description !== undefined}
        <p class={['text-lg leading-8', !overlaid && 'text-base-content/80']}>{@render text(description)}</p>
      {/if}
      {#if actions}
        <div role="group" aria-label={actionsLabel} class={['flex flex-wrap gap-3', centred && 'justify-center']}>
          {@render actions()}
        </div>
      {/if}
      {#if children}<div>{@render children()}</div>{/if}
    </div>
    {#if figure}
      <div class="w-full max-w-md shrink-0">{@render figure()}</div>
    {/if}
  </div>
</section>
