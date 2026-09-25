/**
 * Synthetic `defineEntityForm` definitions for the `EntityForm` suite — a
 * command pair shaped like the apps' creative-work family: a client-id create,
 * a required title, a required FK behind a gated picker, an optional note, a
 * multiline summary, a date, a numeric field, an enum-kind status, and a
 * contributor-style row list.
 */

import { defineEntityForm } from '@thomasfosterau/effect-forms-svelte';
import * as Schema from 'effect/Schema';
import Picker from './EntityFormPicker.svelte';
import RowsWidget from './EntityFormRows.svelte';

const Uuid = Schema.String.check(Schema.isUUID());
const Row = Schema.Struct({ agentId: Schema.String, orderingPosition: Schema.Finite });
const Status = Schema.Literals(['draft', 'published']);

const CreateThing = Schema.Struct({
  id: Schema.optional(Uuid),
  title: Schema.String,
  parentId: Uuid,
  note: Schema.optional(Schema.String),
  summary: Schema.optional(Schema.String),
  published: Schema.optional(Schema.String),
  pages: Schema.optional(Schema.Finite),
  status: Status,
  rows: Schema.optional(Schema.Array(Row)),
});

const UpdateThing = Schema.Struct({
  id: Uuid,
  title: Schema.optional(Schema.String),
  parentId: Schema.optional(Schema.NullOr(Uuid)),
  note: Schema.optional(Schema.NullOr(Schema.String)),
  summary: Schema.optional(Schema.NullOr(Schema.String)),
  published: Schema.optional(Schema.NullOr(Schema.String)),
  pages: Schema.optional(Schema.NullOr(Schema.Finite)),
  status: Schema.optional(Status),
  rows: Schema.optional(Schema.Array(Row)),
});

export const thingForm = defineEntityForm(
  {
    create: CreateThing,
    update: UpdateThing,
    submit: { create: () => 'Create thing', update: () => 'Save changes' },
  },
  (f) => [
    f.text('title', { label: () => 'Title', required: true }),
    f.custom('parentId', Picker, () => ({ label: 'Parent', options: ['a', 'b'] }), { gate: true }),
    f.text('note', { label: () => 'Note', placeholder: () => 'Anything else' }),
    f.textarea('summary', { label: () => 'Summary' }),
    f.text('published', { label: () => 'Published', type: 'date' }),
    f.text('pages', { label: () => 'Pages' }),
    f.select('status', {
      label: () => 'Status',
      required: true,
      optionLabels: { draft: () => 'Draft', published: () => 'Published' },
    }),
    f.rows('rows', RowsWidget, () => ({ label: 'Contributors' })),
  ],
);
