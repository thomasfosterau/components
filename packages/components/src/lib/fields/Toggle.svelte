<!-- @component
A switch for an on/off setting that takes effect immediately, rather than a checkbox submitted with a form.
-->
<!--
  Toggle — a switch: an on/off setting that takes effect immediately, rather
  than a checkbox whose value is submitted with a form.

  ARIA contract: a native `<input type="checkbox">` carrying `role="switch"`,
  so the platform supplies the keyboard (Space) and the checked state while
  the role tells assistive technology to announce "on"/"off" rather than
  "ticked". The visible `label` is inside the `<label>` and so IS the
  accessible name; `description` is deliberately outside it and reached
  through `aria-describedby`, because a paragraph of explanation inside the
  label would be read as part of the name every time focus lands.

  Why the control is NOT `bind:checked`: the browser flips a checkbox the
  instant it is clicked, but `onChange` may refuse the change — the
  registration failed, the reader denied a permission, the server said no.
  So the switch reports an INTENTION, and whatever `onChange` resolves to is
  written back onto the control. Without that write-back a refused change
  leaves the switch showing a state that is not true until the next reload.
  A thrown `onChange` is treated as a refusal for the same reason, and left
  for the caller to report — a switch is not the place to render an error.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { toggleSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'checked' | 'size' | 'onchange'> {
    /** Whether the switch is on. Bindable. */
    checked?: boolean;
    /** Text beside the switch; becomes its accessible name. */
    label: string;
    /** Explanation under the switch, reached through `aria-describedby`. */
    description?: string | undefined;
    /**
     * Apply the change. Whatever it resolves to is what the switch ends up
     * showing, so returning `false` from a request for `true` rejects it.
     * Omitted, the switch is uncontrolled and simply follows the click.
     */
    onChange?: ((next: boolean) => Promise<boolean> | boolean) | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` and the error style. */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
  }

  let {
    checked = $bindable(false),
    label,
    description,
    onChange,
    size = 'md',
    invalid = false,
    describedBy = '',
    disabled = false,
    class: className,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const descriptionId = `${uid}-description`;

  let pending = $state(false);

  const described = $derived(
    [description === undefined ? '' : descriptionId, describedBy]
      .filter((part) => part !== '')
      .join(' '),
  );

  const settle = async (control: HTMLInputElement): Promise<void> => {
    const next = control.checked;
    if (onChange === undefined) {
      checked = next;
      return;
    }
    if (pending) {
      control.checked = checked;
      return;
    }
    pending = true;
    try {
      checked = await onChange(next);
    } catch {
      // A failed change is a refused change: leave `checked` where it was and
      // let the caller surface the reason. Swallowing it here is what keeps
      // the switch honest rather than optimistic.
    } finally {
      pending = false;
      control.checked = checked;
    }
  };
</script>

<div class={['flex flex-col gap-1', className]}>
  <label class="label cursor-pointer justify-start gap-3">
    <input
      {...rest}
      type="checkbox"
      role="switch"
      {checked}
      disabled={disabled || pending}
      aria-busy={pending ? 'true' : undefined}
      aria-invalid={invalid ? 'true' : undefined}
      aria-describedby={described === '' ? undefined : described}
      onchange={(event) => {
        void settle(event.currentTarget);
      }}
      class={['toggle', toggleSize[size], invalid && 'toggle-error']}
    />
    <span>{label}</span>
  </label>
  {#if description !== undefined}
    <p id={descriptionId} class="fieldset-label">{description}</p>
  {/if}
</div>
