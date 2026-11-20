<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import { cardBrand, luhnValid, maskPresets } from '../../lib/fields/mask.ts';
  import MaskedInput from '../../lib/fields/MaskedInput.svelte';

  const { Story } = defineMeta({
    title: 'Fields/MaskedInput',
    component: MaskedInput,
    parameters: {
      docs: {
        description: {
          component:
            'Formats structured values as they are typed, keeping the caret in place and the raw value for the form. Prefer a plain field with a hint and validation; where a mask helps, `formatOn="blur"` suits anything people paste.',
        },
      },
    },
  });
</script>

<script lang="ts">
  let card = $state('');
  const brandNames = { amex: 'Amex', visa: 'Visa', mastercard: 'Mastercard', other: 'Card' };
</script>

<Story name="Australian mobile">
  {#snippet template()}
    <div class="max-w-xs">
      <FormField label="Mobile" hint="For example, 0412 345 678">
        {#snippet children(control)}
          <MaskedInput {...control} mask={maskPresets.auMobile} name="mobile" />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>

<Story name="With a +61 prefix">
  {#snippet template()}
    <div class="max-w-xs">
      <FormField label="Mobile" hint="For example, 412 345 678">
        {#snippet children(control)}
          <MaskedInput {...control} mask="999 999 999" prefix="+61" autocomplete="tel-national" />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>

<Story name="Postcode">
  {#snippet template()}
    <div class="max-w-[10rem]">
      <FormField label="Postcode">
        {#snippet children(control)}
          <MaskedInput {...control} mask={maskPresets.auPostcode} value="2000" />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>

<Story name="Card number">
  {#snippet template()}
    <div class="max-w-xs">
      <FormField
        label="Card number"
        hint={card.length < 12
          ? 'Grouped by brand as you type.'
          : `${brandNames[cardBrand(card)]}, ${luhnValid(card) ? 'checksum valid' : 'checksum invalid'}`}
      >
        {#snippet children(control)}
          <MaskedInput {...control} mask={maskPresets.card} bind:value={card} />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>

<Story name="Format on blur">
  {#snippet template()}
    <div class="max-w-xs">
      <FormField label="Mobile" hint="Type or paste in any format; it is tidied when you leave the field.">
        {#snippet children(control)}
          <MaskedInput {...control} mask={maskPresets.auMobile} formatOn="blur" />
        {/snippet}
      </FormField>
    </div>
  {/snippet}
</Story>
