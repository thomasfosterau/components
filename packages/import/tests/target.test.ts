import { assert, describe, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { importTarget, TargetDescriptor } from '../src/index.ts';
import { Contact } from './fixtures.ts';

describe('importTarget', () => {
  it.effect('describes every field of the issue example, in order', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      assert.strictEqual(target.schema, Contact);
      assert.deepStrictEqual(target.descriptor, {
        fields: [
          {
            key: 'name',
            title: 'Full name',
            kind: 'string',
            isRequired: true,
            importAliases: ['name', 'contact', 'full name'],
          },
          { key: 'email', kind: 'string', isRequired: true, importAliases: [] },
          {
            key: 'dob',
            title: 'Date of birth',
            kind: 'date',
            isRequired: false,
            importAliases: [],
          },
          {
            key: 'tier',
            kind: 'enum',
            isRequired: true,
            enum: ['free', 'pro'],
            importAliases: [],
          },
        ],
      });
    }),
  );

  it.effect('tells numbers, integers, booleans, enums and unknowns apart', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(
        Schema.Struct({
          amount: Schema.Finite,
          count: Schema.Int.annotate({ description: 'How many' }),
          fromText: Schema.FiniteFromString,
          isActive: Schema.Boolean,
          level: Schema.Literals([1, 2, 3]),
          single: Schema.Literal('only'),
          extra: Schema.Unknown,
          note: Schema.optionalKey(Schema.String.annotate({ title: 'Note' })),
          nullable: Schema.NullOr(Schema.String),
          code: Schema.TemplateLiteral(['A-', Schema.Finite]),
          at: Schema.DateTimeUtc,
        }),
      );
      assert.deepStrictEqual(
        target.descriptor.fields.map(({ key, kind }) => [key, kind]),
        [
          ['amount', 'number'],
          ['count', 'integer'],
          ['fromText', 'number'],
          ['isActive', 'boolean'],
          ['level', 'enum'],
          ['single', 'enum'],
          ['extra', 'unknown'],
          ['note', 'string'],
          ['nullable', 'string'],
          ['code', 'string'],
          ['at', 'date'],
        ],
      );
      assert.deepStrictEqual(target.descriptor.fields[1]?.description, 'How many');
      assert.deepStrictEqual(target.descriptor.fields[4]?.enum, [1, 2, 3]);
      assert.deepStrictEqual(target.descriptor.fields[7]?.title, 'Note');
      assert.isFalse(target.descriptor.fields[7]?.isRequired);
    }),
  );

  it.effect('inlines a field that carries an identifier', () =>
    Effect.gen(function* () {
      const Email = Schema.String.annotate({ identifier: 'Email', title: 'Email address' });
      const target = yield* importTarget(Schema.Struct({ email: Email }));
      assert.deepStrictEqual(target.descriptor.fields[0]?.title, 'Email address');
    }),
  );

  it.effect.each([
    ['a nested struct', Schema.Struct({ street: Schema.String }), 'struct'],
    ['a record', Schema.Record(Schema.String, Schema.String), 'struct'],
    ['an array', Schema.Array(Schema.String), 'array'],
    ['a tuple', Schema.Tuple([Schema.String]), 'array'],
    [
      'a union of structs',
      Schema.Union([Schema.Struct({ a: Schema.String }), Schema.Struct({ b: Schema.Finite })]),
      'union',
    ],
    ['a union of scalars', Schema.Union([Schema.String, Schema.Finite]), 'union'],
    ['a class', Schema.instanceOf(URL), 'declaration'],
  ] as const)('fails on %s, naming the field', ([, schema, type]) =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        importTarget(Schema.Struct({ name: Schema.String, address: schema })),
      );
      assert.strictEqual(error._tag, 'UnsupportedFieldType');
      assert.strictEqual(error.field, 'address');
      assert.strictEqual(error.type, type);
      assert.include(error.message, '"address"');
    }),
  );

  it.effect('emits JSON the descriptor schema decodes', () =>
    Effect.gen(function* () {
      const target = yield* importTarget(Contact);
      const json = Schema.fromJsonString(TargetDescriptor);
      const text = yield* Schema.encodeEffect(json)(target.descriptor);
      const decoded = yield* Schema.decodeEffect(json)(text);
      assert.deepStrictEqual(decoded, target.descriptor);
    }),
  );
});
