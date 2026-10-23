import type { Meta, StoryObj } from '@storybook/sveltekit';
import PasswordInput from '../../lib/fields/PasswordInput.svelte';

const meta = {
  title: 'Fields/PasswordInput',
  component: PasswordInput,
  args: { 'aria-label': 'Password', name: 'password' },
  parameters: {
    docs: {
      description: {
        component:
          'A password field with a "Show password" toggle (a pressed-state button with a constant name) and the `autocomplete` that tells a password manager to fill (`purpose="current"`) or generate (`purpose="new"`). Inside a form, spread `FormField`’s `FieldControl` instead of `aria-label`.',
      },
    },
  },
} satisfies Meta<typeof PasswordInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Current: Story = {};

export const New: Story = { args: { 'aria-label': 'New password', purpose: 'new', minlength: 12 } };

export const Revealed: Story = { args: { value: 'correct horse battery', revealed: true } };

export const NoToggle: Story = { args: { revealable: false } };

export const Invalid: Story = { args: { value: 'short', invalid: true } };
