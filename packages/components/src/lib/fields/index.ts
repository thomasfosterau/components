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

export { default as AngleSlider } from './AngleSlider.svelte';
export { default as Checkbox } from './Checkbox.svelte';
export { default as CheckboxGroup } from './CheckboxGroup.svelte';
export { default as ColorSwatchGroup, type ColorSwatch } from './ColorSwatchGroup.svelte';
export { default as Cascader } from './Cascader.svelte';
export { default as Combobox } from './Combobox.svelte';
export { default as ContextualHelp, type ContextualHelpPlacement } from './ContextualHelp.svelte';
export { default as DateInput } from './DateInput.svelte';
export { default as Dropzone } from './Dropzone.svelte';
export { default as FieldErrors } from './FieldErrors.svelte';
export { default as Fieldset } from './Fieldset.svelte';
export { default as FileInput } from './FileInput.svelte';
export { default as FormField } from './FormField.svelte';
export { default as ImageCropper } from './ImageCropper.svelte';
export { default as ImageInput } from './ImageInput.svelte';
export { default as MentionInput } from './MentionInput.svelte';
export { default as Listbox } from './Listbox.svelte';
export { default as MaskedInput } from './MaskedInput.svelte';
export { default as MultiSelect } from './MultiSelect.svelte';
export { default as NumberField } from './NumberField.svelte';
export { default as PasswordInput } from './PasswordInput.svelte';
export { default as PinInput } from './PinInput.svelte';
export { default as RadioGroup } from './RadioGroup.svelte';
export { default as Rating } from './Rating.svelte';
export { default as SearchInput } from './SearchInput.svelte';
export { default as Select } from './Select.svelte';
export { default as SignaturePad } from './SignaturePad.svelte';
export { default as Slider } from './Slider.svelte';
export { default as TagsInput } from './TagsInput.svelte';
export { default as Textarea } from './Textarea.svelte';
export { default as TextInput } from './TextInput.svelte';
export { default as Toggle } from './Toggle.svelte';
export { default as TransferList } from './TransferList.svelte';
export { default as TreeSelect } from './TreeSelect.svelte';
export {
  default as PushToggle,
  type PushDeclineReason,
  type PushEnableResult,
} from './PushToggle.svelte';
export { default as VideoInput } from './VideoInput.svelte';
export { default as WheelPicker } from './WheelPicker.svelte';

export * from './field-types.ts';
export type { FileRejection } from './file-validation.ts';
export type { CascaderNode } from './cascader.ts';
export type { TreeSelectStrategy } from './tree-select.ts';
export { parseMentions, serializeMentions } from './mentions.ts';
export type { MentionOption, MentionToken, MentionTrigger, ParsedMentions } from './mentions.ts';
export type { CropArea, CropPlace, CropReadout, CropRotation } from './crop.ts';
export type { CropExportOptions } from './crop-export.ts';

export { cardBrand, luhnValid, maskPresets, type Mask, type MaskPreset } from './mask.ts';

export { compass8, compass16, type AngleZero } from './angle.ts';

export { signatureToPng, type SignatureValue } from './signature.ts';
export type { ImageCropOptions } from './ImageInput.svelte';

export type { WheelColumnDef, WheelOption, WheelValue } from './wheel.ts';
