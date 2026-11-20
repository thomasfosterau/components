<!-- @component
The inside of a `RadioGroup` or `CheckboxGroup` card: title, description and check badge; internal, not exported.
-->
<script lang="ts">
  import { Check } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import type { ChoiceCardState, FieldOption } from './field-types.ts';

  interface Props {
    option: FieldOption;
    state: ChoiceCardState;
    titleId: string;
    descriptionId: string;
    /** The caller's body in place of the title and description. */
    card: Snippet<[FieldOption, ChoiceCardState]> | undefined;
    /** The radio marker or the checkbox, before or after the body. */
    indicator: Snippet<[]> | undefined;
    indicatorAtEnd: boolean;
  }

  let { option, state, titleId, descriptionId, card, indicator, indicatorAtEnd }: Props = $props();
</script>

{#if !indicatorAtEnd}{@render indicator?.()}{/if}
<span class="flex min-w-0 flex-1 flex-col gap-1">
  {#if card}
    <span id={titleId} class="sr-only">{option.label}</span>
    {@render card(option, state)}
  {:else}
    <span id={titleId} class="font-semibold">{option.label}</span>
  {/if}
  {#if option.description !== undefined}
    <span id={descriptionId} class={card ? 'sr-only' : 'text-base-content/70 text-sm'}>{option.description}</span>
  {/if}
</span>
{#if state.checked}
  <span class="badge badge-primary badge-sm shrink-0" aria-hidden="true"><Check class="size-3" /></span>
{/if}
{#if indicatorAtEnd}{@render indicator?.()}{/if}
