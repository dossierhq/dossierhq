import { ErrorType, notOk, ok } from '.';
import type { EntityFieldSpecification, Result } from '.';
import { EntityFieldType } from './Schema';
import type { EntityFieldValueTypeMap } from './Schema';

export interface EntityFieldTypeAdapter<TDecoded = unknown, TEncoded = unknown> {
  encodeData(prefix: string, decodedData: TDecoded): Result<TEncoded, ErrorType.BadRequest>;
  decodeData(encodedData: TEncoded): TDecoded;
  getReferenceUUIDs(decodedData: TDecoded): null | string[];
}

const referenceCodec: EntityFieldTypeAdapter<
  EntityFieldValueTypeMap[EntityFieldType.Reference],
  string
> = {
  encodeData: (prefix: string, x) => ok(x.id),
  decodeData: (x) => ({ id: x }),
  getReferenceUUIDs: (x) => (x ? [x.id] : null),
};

const stringCodec: EntityFieldTypeAdapter<
  EntityFieldValueTypeMap[EntityFieldType.String],
  string
> = {
  encodeData: (prefix: string, x) =>
    typeof x === 'string'
      ? ok(x)
      : notOk.BadRequest(`${prefix}: expected string, got ${Array.isArray(x) ? 'list' : typeof x}`),
  decodeData: (x) => x,
  getReferenceUUIDs: (unusedX) => null,
};

const adapters: Record<EntityFieldType, EntityFieldTypeAdapter<unknown>> = {
  [EntityFieldType.Reference]: referenceCodec,
  [EntityFieldType.String]: stringCodec,
};

export function getAdapter(fieldSpec: EntityFieldSpecification): EntityFieldTypeAdapter {
  const result = adapters[fieldSpec.type];
  if (!result) {
    throw new Error(`Can't find field type (${fieldSpec.type})`);
  }
  return result;
}
