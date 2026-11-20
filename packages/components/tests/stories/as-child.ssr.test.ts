/**
 * Svelte CSF renders a `<Story>`'s children as a `children` snippet passed to
 * the meta component unless the story sets `asChild`, so authored markup is
 * silently dropped. Every story in the workspace with children must opt in,
 * or render through a `template` snippet.
 */
import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse, type AST } from 'svelte/compiler';
import { expect, test } from 'vite-plus/test';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const files = globSync('*/src/stories/**/*.stories.svelte', { cwd: root });

type Node = AST.Fragment['nodes'][number];

const isContent = (node: Node) =>
  node.type !== 'Comment' && !(node.type === 'Text' && node.data.trim() === '');

const isNode = (value: object): value is Node => 'type' in value && 'start' in value;

const isTemplate = (node: Node) =>
  node.type === 'SnippetBlock' && node.expression.name === 'template';

/** Names and lines of the `<Story>`s in `source` whose children would be dropped. */
function droppedStories(source: string): string[] {
  const found: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value !== 'object' || value === null) return;
    if (Array.isArray(value)) return value.forEach(visit);
    if (isNode(value) && value.type === 'Component' && value.name === 'Story') {
      const node = value;
      const asChild = node.attributes.some((a) => a.type === 'Attribute' && a.name === 'asChild');
      const children = node.fragment.nodes.filter(isContent);
      if (!asChild && children.length > 0 && !children.some(isTemplate)) {
        const line = source.slice(0, node.start).split('\n').length;
        found.push(`line ${line}`);
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (key !== 'parent') visit(child);
    }
  };
  visit(parse(source, { modern: true }).fragment);
  return found;
}

test('finds the story files', () => {
  expect(files.length).toBeGreaterThan(100);
});

test.each(files)('every <Story> with children in %s sets asChild or a template', (file) => {
  expect(droppedStories(readFileSync(root + file, 'utf8'))).toEqual([]);
});

test('flags a story whose children are not asChild', () => {
  const source = `<Story name="A"><Button /></Story>
<Story name="B" asChild><Button /></Story>
<Story name="C">{#snippet template()}<Button />{/snippet}</Story>
<Story name="D" />`;
  expect(droppedStories(source)).toEqual(['line 1']);
});
