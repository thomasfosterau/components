<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import NavigationStack from '../../../src/lib/layout/NavigationStack.svelte';
  import StackPage from '../../../src/lib/layout/StackPage.svelte';
  import { createNavigationStack } from '../../../src/lib/layout/stack-direction.svelte.ts';

  // A real router has the URL on the first page already; put it there, and back afterwards.
  const original = window.location.href;
  history.replaceState(history.state, '', '/beds');
  onDestroy(() => history.replaceState(history.state, '', original));

  const stack = createNavigationStack();
  let path = $state('/beds');
  let trail: string[] = [];

  /** A stand-in router: report the navigation, swap the page, then complete it. */
  const go = async (to: string, type = 'link', delta?: number): Promise<void> => {
    const { promise: complete, resolve: done } = Promise.withResolvers<void>();
    const wait = stack.onNavigate({ type, delta, to: { url: new URL(to, window.location.href) }, complete });
    if (wait) await wait;
    if (type !== 'popstate') trail = [...trail, path];
    history.replaceState(history.state, '', to);
    path = to;
    await tick();
    done();
  };

  const browserBack = (): void => {
    const previous = trail.at(-1);
    if (previous === undefined) return;
    trail = trail.slice(0, -1);
    void go(previous, 'popstate', -1);
  };

  const onclick = (event: MouseEvent): void => {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (!link) return;
    event.preventDefault();
    const target = new URL(link.href).pathname;
    if (target === trail.at(-1)) {
      trail = trail.slice(0, -1);
      void go(target);
    } else {
      void go(target);
    }
  };
</script>

<button type="button" onclick={browserBack}>Browser back</button>
<NavigationStack {onclick}>
  {#key path}
    {#if path === '/beds'}
      <StackPage title="Beds">
        <ul>
          <li><a href="/beds/3">Bed 3</a></li>
          <li><a href="/beds/4">Bed 4</a></li>
        </ul>
      </StackPage>
    {:else}
      <StackPage title={`Bed ${path.split('/').at(-1)}`} backHref="/beds">
        <p>Tomatoes, basil.</p>
      </StackPage>
    {/if}
  {/key}
</NavigationStack>
