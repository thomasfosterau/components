import type { Data, DataRef, InlineData } from './types.ts';

/** Returns true if the spec's data is inline values. */
export function isInlineData(data: Data): data is InlineData {
  return 'values' in data;
}

/** Returns true if the spec's data is an external reference. */
export function isDataRef(data: Data): data is DataRef {
  return 'ref' in data;
}
