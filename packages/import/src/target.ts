/**
 * The import target: the app's `Schema.Struct`, which decodes the records,
 * and the JSON field descriptor derived from it, which a UI reads to list
 * and match the fields.
 *
 * @module
 */

import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as SchemaAST from 'effect/SchemaAST';

/** What kind of value a field holds, for the UI: how to show it and which columns suit it. */
export const FieldKind = Schema.Literals([
  'string',
  'number',
  'integer',
  'boolean',
  'date',
  'enum',
  'unknown',
]);
/** The decoded type of {@link FieldKind}. */
export type FieldKind = typeof FieldKind.Type;

/** A member of an `enum` field: a literal the field accepts. */
export const EnumMember = Schema.Union([Schema.String, Schema.Finite, Schema.Boolean]);
/** The decoded type of {@link EnumMember}. */
export type EnumMember = typeof EnumMember.Type;

/** One target field, as the UI sees it. */
export const FieldDescriptor = Schema.Struct({
  /** The field's key in the target struct. */
  key: Schema.String,
  title: Schema.optionalKey(Schema.String),
  description: Schema.optionalKey(Schema.String),
  kind: FieldKind,
  /** Whether a record must carry the field (its key is not optional in the struct). */
  isRequired: Schema.Boolean,
  /** The literals an `enum` field accepts, in declaration order. Absent on any other kind. */
  enum: Schema.optionalKey(Schema.Array(EnumMember)),
  /** The field's `importAliases` annotation, or `[]`. */
  importAliases: Schema.Array(Schema.String),
});
/** The decoded type of {@link FieldDescriptor}. */
export type FieldDescriptor = typeof FieldDescriptor.Type;

/** The target as JSON: its fields, in the struct's order. */
export const TargetDescriptor = Schema.Struct({
  fields: Schema.Array(FieldDescriptor),
}).annotate({
  identifier: 'TargetDescriptor',
  description: 'The fields of an import target, for a UI and for transport.',
});
/** The decoded type of {@link TargetDescriptor}. */
export type TargetDescriptor = typeof TargetDescriptor.Type;

/** A target struct: any `Schema.Struct`. */
export type TargetSchema = Schema.Struct<Schema.Struct.Fields>;

/** An import target: the struct that decodes each record, and its descriptor. */
export interface ImportTarget<S extends TargetSchema> {
  readonly schema: S;
  readonly descriptor: TargetDescriptor;
}

/**
 * A field whose type the mapper cannot fill from one cell: a nested struct
 * (or record), an array (or tuple), a union that is not a set of literals,
 * or a declaration other than a date. Nested targets are a follow-up.
 */
export class UnsupportedFieldType extends Schema.TaggedError<
  UnsupportedFieldType,
  { readonly brand: unique symbol }
>()('UnsupportedFieldType', {
  field: Schema.String,
  type: Schema.Literals(['struct', 'array', 'union', 'declaration', 'other']),
  message: Schema.String,
}) {}

/** The unsupported type, or the kind and (for an enum) the literals of a field. */
type Classified = Result.Result<
  { readonly kind: FieldKind; readonly members: Option.Option<ReadonlyArray<EnumMember>> },
  UnsupportedFieldType['type']
>;

const scalar = (kind: FieldKind): Classified => Result.succeed({ kind, members: Option.none() });

/** The `representation` annotation of the date declarations a cell can fill. */
const isDateRepresentation = Schema.is(
  Schema.Struct({ id: Schema.Literals(['effect/schema/Date', 'effect/schema/DateTimeUtc']) }),
);

/** The literal a member contributes to an enum, if it is one a descriptor can carry. */
const enumMembersOf = (ast: SchemaAST.AST): Option.Option<ReadonlyArray<EnumMember>> => {
  if (SchemaAST.isLiteral(ast)) {
    const value = ast.literal;
    return P.isBigInt(value) ? Option.none() : Option.some([value]);
  }
  if (SchemaAST.isEnum(ast)) return Option.some(Arr.map(ast.enums, ([, value]) => value));
  return Option.none();
};

/** A union's members, less `undefined` and `null` (which an empty cell stands for). */
const presentMembers = (ast: SchemaAST.Union): ReadonlyArray<SchemaAST.AST> =>
  Arr.filter(ast.types, (m) => !SchemaAST.isUndefined(m) && !SchemaAST.isNull(m));

/** An enum of `ast`'s literals, or `fallback` when some member is not a literal a descriptor can carry. */
const enumOf = (
  asts: ReadonlyArray<SchemaAST.AST>,
  fallback: UnsupportedFieldType['type'],
): Classified =>
  Option.match(Option.all(Arr.map(asts, enumMembersOf)), {
    onNone: () => Result.fail(fallback),
    onSome: (sets) => Result.succeed({ kind: 'enum', members: Option.some(Arr.flatten(sets)) }),
  });

/** A union of one present member is that member; any other is an enum or unsupported. */
const classifyUnion = (ast: SchemaAST.Union): Classified => {
  const members = presentMembers(ast);
  const [only] = members;
  return only !== undefined && Arr.isReadonlyArrayEmpty(Arr.drop(members, 1))
    ? classify(only)
    : enumOf(members, 'union');
};

/** The type nodes a single cell fills, or refuses, by what they are. */
const byNode: ReadonlyArray<readonly [(ast: SchemaAST.AST) => boolean, Classified]> = [
  [SchemaAST.isString, scalar('string')],
  [SchemaAST.isTemplateLiteral, scalar('string')],
  [SchemaAST.isNumber, scalar('number')],
  [SchemaAST.isBoolean, scalar('boolean')],
  [SchemaAST.isUnknown, scalar('unknown')],
  [SchemaAST.isAny, scalar('unknown')],
  [SchemaAST.isObjects, Result.fail('struct')],
  [SchemaAST.isArrays, Result.fail('array')],
];

/** The kind of a field's type side, or why it is unsupported. */
const classify = (ast: SchemaAST.AST): Classified => {
  if (SchemaAST.isUnion(ast)) return classifyUnion(ast);
  if (SchemaAST.isLiteral(ast) || SchemaAST.isEnum(ast)) return enumOf([ast], 'other');
  if (SchemaAST.isDeclaration(ast)) {
    return isDateRepresentation(ast.annotations?.['representation'])
      ? scalar('date')
      : Result.fail('declaration');
  }
  return Arr.findFirst(byNode, ([is]) => is(ast)).pipe(
    Option.map(([, classified]) => classified),
    Option.getOrElse((): Classified => Result.fail('other')),
  );
};

const unsupportedMessages: Record<UnsupportedFieldType['type'], string> = {
  struct: 'is a nested struct or record',
  array: 'is an array or tuple',
  union: 'is a union that is not a set of literals',
  declaration: 'is a declaration other than a date',
  other: 'has a type no single cell can fill',
};

/** The keys of one JSON Schema node that the descriptor reads. */
const JsonSchemaNode = Schema.Struct({
  type: Schema.optionalKey(Schema.Json),
  title: Schema.optionalKey(Schema.String),
  description: Schema.optionalKey(Schema.String),
  importAliases: Schema.optionalKey(Schema.Array(Schema.String)),
});
type JsonSchemaNode = typeof JsonSchemaNode.Type;

/** The keys of the struct's JSON Schema that the descriptor reads. */
const JsonSchemaObject = Schema.Struct({
  properties: Schema.Record(
    Schema.String,
    Schema.Struct({
      ...JsonSchemaNode.fields,
      anyOf: Schema.optionalKey(Schema.Array(JsonSchemaNode)),
    }),
  ),
  required: Schema.optionalKey(Schema.Array(Schema.String)),
});
type JsonSchemaProperty = (typeof JsonSchemaObject.Type)['properties'][string];

/**
 * The node a field's documentation sits on, and the one its optionality
 * wraps: an optional field's JSON form is `anyOf: [<field>, { type: "null" }]`,
 * whose annotations may sit on either level.
 */
const docNodes = (property: JsonSchemaProperty): ReadonlyArray<JsonSchemaNode> => {
  const inner = Arr.filter(property.anyOf ?? [], (node) => node.type !== 'null');
  const [only] = inner;
  return only !== undefined && Arr.isReadonlyArrayEmpty(Arr.drop(inner, 1))
    ? [property, only]
    : [property];
};

/** The first of `nodes` that carries `key`. */
const firstOf = <K extends 'title' | 'description' | 'importAliases'>(
  nodes: ReadonlyArray<JsonSchemaNode>,
  key: K,
): Option.Option<NonNullable<JsonSchemaNode[K]>> =>
  Arr.findFirst(
    Arr.map(nodes, (node) => Option.fromUndefinedOr(node[key])),
    Option.isSome,
  ).pipe(Option.flatten);

/**
 * A field's descriptor as the code builds it, absence as `Option`; encoding
 * it gives the {@link FieldDescriptor} JSON, where an absent value is an
 * absent key.
 */
const FieldDraft = Schema.Struct({
  ...FieldDescriptor.fields,
  title: Schema.OptionFromOptionalKey(Schema.String),
  description: Schema.OptionFromOptionalKey(Schema.String),
  enum: Schema.OptionFromOptionalKey(Schema.Array(EnumMember)),
});
type FieldDraft = typeof FieldDraft.Type;

const encodeFields = Schema.encodeEffect(Schema.Array(FieldDraft));

/** One field's descriptor, or why its type is unsupported. */
const describeField = (
  key: string,
  ast: SchemaAST.AST,
  jsonSchema: typeof JsonSchemaObject.Type,
): Result.Result<FieldDraft, UnsupportedFieldType> =>
  Result.mapBoth(classify(SchemaAST.toType(ast)), {
    onFailure: (type) =>
      new UnsupportedFieldType({
        field: key,
        type,
        message: `The field "${key}" ${unsupportedMessages[type]}, which an import cannot fill from one cell.`,
      }),
    onSuccess: ({ kind, members }) => {
      const nodes = Option.match(R.get(jsonSchema.properties, key), {
        onNone: () => [],
        onSome: docNodes,
      });
      const isInteger = Arr.some(nodes, (node) => node.type === 'integer');
      return {
        key,
        title: firstOf(nodes, 'title'),
        description: firstOf(nodes, 'description'),
        kind: kind === 'number' && isInteger ? 'integer' : kind,
        isRequired: Arr.contains(jsonSchema.required ?? [], key),
        enum: members,
        importAliases: Option.getOrElse(firstOf(nodes, 'importAliases'), () => []),
      };
    },
  });

/**
 * Compiles a target struct into an {@link ImportTarget}: the struct itself,
 * which decodes every record, and its JSON {@link TargetDescriptor}, derived
 * from `Schema.toJsonSchemaDocument` (titles, descriptions, which keys are
 * required, integers, the `importAliases` annotation) and the struct's AST
 * (each field's kind, an enum's literals).
 *
 * Fails with {@link UnsupportedFieldType}, naming the first field whose type
 * no single cell can fill (a nested struct, an array, a union of structs),
 * so a target the mapper cannot serve is refused here rather than in the UI.
 *
 * ```ts
 * const Contact = Schema.Struct({
 *   name: Schema.String.annotate({ title: 'Full name', importAliases: ['contact'] }),
 *   tier: Schema.Literals(['free', 'pro']),
 * });
 * const target = yield* importTarget(Contact);
 * target.descriptor.fields[1]; // { key: 'tier', kind: 'enum', enum: ['free', 'pro'], … }
 * ```
 */
export const importTarget = Effect.fnUntraced(function* <S extends TargetSchema>(
  schema: S,
): Effect.fn.Return<ImportTarget<S>, UnsupportedFieldType> {
  const document = Schema.toJsonSchemaDocument(schema, {
    referencePolicy: () => undefined,
    includeAnnotationKey: (key) => key === 'importAliases',
  });
  const jsonSchema = yield* Schema.decodeUnknownEffect(JsonSchemaObject)(document.schema).pipe(
    Effect.orDie,
  );
  const fields = yield* Effect.forEach(
    R.toEntries(schema.fields),
    ([key, field]) => Effect.fromResult(describeField(key, field.ast, jsonSchema)),
    { concurrency: 1 },
  );
  const descriptor: TargetDescriptor = { fields: yield* encodeFields(fields).pipe(Effect.orDie) };
  return { schema, descriptor };
});
