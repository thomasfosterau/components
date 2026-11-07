<!-- @component
A block of code, a shell transcript or a config file on daisyUI `mockup-code`, with optional line prefixes, a caption and a copy action.
-->
<!--
  CodeBlock — `<pre><code>` inside daisyUI's `mockup-code` frame, with
  optional per-line prefixes (line numbers, `$`, `>`), an optional caption,
  and a `CopyButton` that copies the raw `code` — never the DOM text, so a
  prefix can never leak into the clipboard.

  No syntax highlighting, deliberately: every highlighter is hundreds of kB
  of grammars, and a component that needs one belongs in its own package
  (AGENTS.md). A caller with highlighted markup passes it as `children`; the
  copy button still copies `code`. With `children`, `prefix` and
  `highlightLines` are ignored — the markup's line boundaries are the
  caller's.

  ARIA contract:
  - With a `caption` it is a `<figure>` named by its `<figcaption>`;
    otherwise a `<div>`.
  - The scroll container becomes focusable — `tabindex="0"`,
    `role="region"`, named by the caption or "<language> code" — only while
    its content overflows horizontally, so a keyboard user can scroll it
    (WCAG 2.1.1, axe's `scrollable-region-focusable`) and a short block adds
    no tab stop. Overflow is measured with a `ResizeObserver`.
  - Prefixes are daisyUI's: `<pre data-prefix>` per line, drawn by a
    `::before` from the attribute, so they are not selected or copied. Some
    screen readers may read generated content; if that proves a problem,
    an `aria-hidden` gutter is the alternative.
  - The copy action is `CopyButton`'s: a constant name and a polite status.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import CopyButton from './CopyButton.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'prefix'> {
    /** The raw source: rendered as text unless `children` is given, and always what is copied. */
    code: string;
    /** The language: `class="language-<lang>"` on `<code>`, `data-language` on the frame. */
    language?: string | undefined;
    /** Per-line prefix: `'numbers'`, a fixed string such as `'$'`, or a function of the 1-based line. */
    prefix?: string | ((line: number) => string) | undefined;
    /** 1-based lines to emphasise. */
    highlightLines?: readonly number[] | undefined;
    /** A filename or caption above the code; makes the block a named `<figure>`. */
    caption?: string | undefined;
    /**
     * Show the copy button.
     * @defaultValue `true`
     */
    copyable?: boolean | undefined;
    /**
     * The copy button's accessible name.
     * @defaultValue `'Copy code'`
     */
    copyLabel?: string | undefined;
    /**
     * Announced after a successful copy.
     * @defaultValue `'Copied'`
     */
    copiedLabel?: string | undefined;
    /**
     * The scroll region's name when there is no caption, after the language.
     * @defaultValue `'code'`
     */
    regionLabel?: string | undefined;
    /** Pre-rendered markup (a highlighter's output) in place of the escaped `code`. */
    children?: Snippet<[]> | undefined;
  }

  let {
    code,
    language,
    prefix,
    highlightLines = [],
    caption,
    copyable = true,
    copyLabel = 'Copy code',
    copiedLabel = 'Copied',
    regionLabel = 'code',
    children,
    class: className,
    ...rest
  }: Props = $props();

  const lines = $derived(code.split('\n'));
  const prefixFor = (line: number): string =>
    prefix === 'numbers'
      ? String(line)
      : typeof prefix === 'function'
        ? prefix(line)
        : (prefix ?? '');

  let scroller: HTMLDivElement | undefined = $state();
  let overflowing = $state(false);

  $effect(() => {
    const node = scroller;
    if (node === undefined || typeof ResizeObserver === 'undefined') return;
    const measure = (): void => {
      overflowing = node.scrollWidth > node.clientWidth;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  });

  const name = $derived(
    caption ?? [language, regionLabel].filter((part) => part !== undefined).join(' '),
  );
  const languageClass = $derived(language === undefined ? undefined : `language-${language}`);
</script>

{#snippet body()}
  <div class="relative">
    <!-- `tabindex` is only ever set together with `role="region"` (while the
         content overflows), which the static check cannot see. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      bind:this={scroller}
      class={['mockup-code overflow-x-auto', className]}
      data-language={language}
      role={overflowing ? 'region' : undefined}
      aria-label={overflowing ? name : undefined}
      tabindex={overflowing ? 0 : undefined}
    >
      {#if children}
        <pre><code class={languageClass}>{@render children()}</code></pre>
      {:else if prefix === undefined && highlightLines.length === 0}
        <pre><code class={languageClass}>{code}</code></pre>
      {:else}
        {#each lines as line, index (index)}
          <pre
            data-prefix={prefix === undefined ? undefined : prefixFor(index + 1)}
            class={highlightLines.includes(index + 1)
              ? 'bg-warning text-warning-content'
              : undefined}><code class={languageClass}>{line}</code></pre>
        {/each}
      {/if}
    </div>
    {#if copyable}
      <CopyButton
        value={code}
        label={copyLabel}
        {copiedLabel}
        iconOnly
        size="sm"
        class="text-neutral-content absolute end-2 top-2"
      />
    {/if}
  </div>
{/snippet}

{#if caption !== undefined}
  <figure {...rest}>
    <figcaption class="text-base-content/70 mb-1 font-mono text-sm">{caption}</figcaption>
    {@render body()}
  </figure>
{:else}
  <div {...rest}>{@render body()}</div>
{/if}
