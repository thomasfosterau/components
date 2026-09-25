/**
 * fields — form controls wired through `FormField`'s `FieldControl` contract.
 *
 * The shape every control in here shares: `FormField` (or `Fieldset`) owns
 * the label, the hint and the errors, derives one `id` into a `describedBy`
 * and an `invalid` flag, and hands that `FieldControl` to its `children`
 * snippet. A control spreads it — `<TextInput {...control} bind:value />` —
 * and so carries `aria-describedby`, `aria-invalid` and `required` without
 * either side knowing the other's markup.
 *
 * Optional props are declared `T | undefined` rather than `prop?: T`: the
 * workspace compiles with `exactOptionalPropertyTypes`, under which a caller
 * forwarding its own optional prop would not compile otherwise.
 *
 * @module
 */

export { default as Checkbox } from './Checkbox.svelte';
export { default as CheckboxGroup } from './CheckboxGroup.svelte';
export { default as Combobox } from './Combobox.svelte';
export { default as DateInput } from './DateInput.svelte';
export { default as FieldErrors } from './FieldErrors.svelte';
export { default as Fieldset } from './Fieldset.svelte';
export { default as FileInput } from './FileInput.svelte';
export { default as FormField } from './FormField.svelte';
export { default as ImageInput } from './ImageInput.svelte';
export { default as RadioGroup } from './RadioGroup.svelte';
export { default as SearchInput } from './SearchInput.svelte';
export { default as Select } from './Select.svelte';
export { default as Textarea } from './Textarea.svelte';
export { default as TextInput } from './TextInput.svelte';
export { default as Toggle } from './Toggle.svelte';
export {
  default as PushToggle,
  type PushDeclineReason,
  type PushEnableResult,
} from './PushToggle.svelte';
export { default as VideoInput } from './VideoInput.svelte';

export * from './field-types.ts';
