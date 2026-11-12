/**
 * `@thomasfosterau/components-import`: the headless core of the data import
 * mapper. The target descriptor, the mapping spec and the engine; plain
 * TypeScript over Effect, with no DOM, so an app server can import it too.
 *
 * @module
 */

export type { ImportAliases } from './annotations.ts';
export {
  applyMapping,
  ColumnNotFound,
  UnknownTargetField,
  UnsupportedMapping,
  type ApplyMappingError,
  type ApplyMappingOptions,
  type CellEdit,
  type CellPosition,
  type MappedRow,
  type RowIssue,
} from './apply.ts';
export {
  ColumnMapping,
  ColumnRef,
  ConstantMapping,
  CustomMapping,
  decodeImportSpec,
  FieldMapping,
  ImportSource,
  ImportSpec,
  ParseOptions,
  RegexMapping,
  SkipMapping,
  SourceFingerprint,
  SplitMapping,
  TableLocator,
  TemplateMapping,
  ValueMapMapping,
} from './spec.ts';
export { sourceTableFromGrid, type SourceCell, type SourceRow, type SourceTable } from './table.ts';
export {
  EnumMember,
  FieldDescriptor,
  FieldKind,
  importTarget,
  TargetDescriptor,
  UnsupportedFieldType,
  type ImportTarget,
  type TargetSchema,
} from './target.ts';
