<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import CodeBlock from '../../lib/ui/CodeBlock.svelte';

  const { Story } = defineMeta({
    title: 'UI/CodeBlock',
    component: CodeBlock,
    parameters: {
      docs: {
        description: {
          component:
            'Code on daisyUI `mockup-code`, with optional line prefixes, a caption and a copy action that copies the raw `code` (never the prefixes). No highlighter is included: pass already-highlighted markup as `children`.',
        },
      },
    },
  });

  const config = `import { defineConfig } from 'vite-plus';\n\nexport default defineConfig({\n  fmt: { singleQuote: true },\n});`;
</script>

<Story name="Shell">
  <CodeBlock code={'pnpm add @thomasfosterau/components\npnpm exec playwright install'} prefix="$" />
</Story>

<Story name="Numbered, with a caption and a highlighted line">
  <CodeBlock code={config} language="ts" prefix="numbers" caption="vite.config.ts" highlightLines={[4]} />
</Story>

<Story name="Pre-highlighted markup">
  <!-- A highlighter's output goes in `children`; the copy button still copies `code`. -->
  <CodeBlock code={'const answer = 42;'} language="ts">
    <span class="text-info">const</span> answer = <span class="text-warning">42</span>;
  </CodeBlock>
</Story>

<Story name="Overflowing, so its scroller is a focusable region">
  <div class="max-w-sm">
    <CodeBlock code={'curl -fsSL https://example.com/a/very/long/install/script/that/does/not/fit.sh | bash'} language="bash" />
  </div>
</Story>
