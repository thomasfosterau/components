<!-- Storybook only: `<Head>` and `<JsonLd>` render into `<svelte:head>`, so
     there is nothing in the canvas to look at. This lists what they put in
     the document head, re-read whenever it changes. -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet<[]>;
  }

  let { children }: Props = $props();

  let rows = $state<{ tag: string; key: string; value: string }[]>([]);

  const read = (): void => {
    rows = Array.from(document.head.querySelectorAll('title, meta[property], meta[name], link[rel], script[type="application/ld+json"]'))
      .filter((el) => el.closest('[data-storybook]') === null)
      .filter((el) => el.tagName !== 'META' || /^(og:|twitter:|article:|description|keywords|robots)/.test(el.getAttribute('property') ?? el.getAttribute('name') ?? ''))
      .filter((el) => el.tagName !== 'LINK' || /^(canonical|alternate|prev|next)$/.test(el.getAttribute('rel') ?? ''))
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        key:
          el.getAttribute('property') ??
          el.getAttribute('name') ??
          [el.getAttribute('rel'), el.getAttribute('hreflang') ?? el.getAttribute('type')].filter(Boolean).join(' '),
        value: el.getAttribute('content') ?? el.getAttribute('href') ?? el.textContent ?? '',
      }));
  };

  $effect(() => {
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.head, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  });
</script>

{@render children()}

<table class="table-sm table max-w-3xl">
  <caption class="text-left font-semibold">What the component put in <code>&lt;head&gt;</code></caption>
  <thead>
    <tr><th scope="col">Element</th><th scope="col">Key</th><th scope="col">Value</th></tr>
  </thead>
  <tbody>
    {#each rows as row, index (index)}
      <tr>
        <td><code>{row.tag}</code></td>
        <td><code>{row.key}</code></td>
        <td class="break-all">{row.value}</td>
      </tr>
    {/each}
  </tbody>
</table>
