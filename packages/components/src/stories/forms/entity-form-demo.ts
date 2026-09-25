/**
 * Storybook only: a `defineEntityForm` definition shaped like an app's — a
 * client-id create, a required title, a gated parent picker, a note, a
 * summary, a date and an enum-kind status.
 */

import { defineEntityForm } from '@thomasfosterau/effect-forms-svelte';
import * as Schema from 'effect/Schema';
import ParentPicker from './EntityFormParentPicker.svelte';

const Uuid = Schema.String.check(Schema.isUUID());
const Status = Schema.Literals(['draft', 'published']);

export const bedForm = defineEntityForm(
  {
    create: Schema.Struct({
      id: Schema.optional(Uuid),
      name: Schema.String,
      gardenId: Schema.String,
      notes: Schema.optional(Schema.String),
      planted: Schema.optional(Schema.String),
      status: Status,
    }),
    update: Schema.Struct({
      id: Uuid,
      name: Schema.optional(Schema.String),
      gardenId: Schema.optional(Schema.NullOr(Schema.String)),
      notes: Schema.optional(Schema.NullOr(Schema.String)),
      planted: Schema.optional(Schema.NullOr(Schema.String)),
      status: Schema.optional(Status),
    }),
    submit: { create: () => 'Create bed', update: () => 'Save bed' },
  },
  (f) => [
    f.text('name', { label: () => 'Name', required: true, placeholder: () => 'Bed 4' }),
    f.custom(
      'gardenId',
      ParentPicker,
      () => ({
        label: 'Garden',
        options: [
          { value: 'north', label: 'North garden' },
          { value: 'kitchen', label: 'Kitchen garden' },
        ],
      }),
      { gate: true },
    ),
    f.textarea('notes', { label: () => 'Notes' }),
    f.text('planted', { label: () => 'Planted', type: 'date' }),
    f.select('status', {
      label: () => 'Status',
      required: true,
      optionLabels: { draft: () => 'Draft', published: () => 'Published' },
    }),
  ],
);
