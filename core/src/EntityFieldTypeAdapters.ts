import { ErrorType, notOk, ok } from '.';
import type { FieldSpecification, Result } from '.';
import { FieldType } from './Schema';
import type { FieldValueTypeMap } from './Schema';

export interface FieldTypeAdapter<TDecoded = unknown, TEncoded = unknown> {
  encodeData(prefix: string, decodedData: TDecoded): Result<TEncoded, ErrorType.BadRequest>;
  decodeData(encodedData: TEncoded): TDecoded;
  getReferenceUUIDs(decodedData: TDecoded): null | string[];
}

const referenceCodec: FieldTypeAdapter<FieldValueTypeMap[FieldType.Reference], string> = {
  encodeData: (prefix: string, x) => {
    if (Array.isArray(x)) {
      return notOk.BadRequest(`${prefix}: expected reference, got list`);
    }
    if (typeof x !== 'object') {
      return notOk.BadRequest(`${prefix}: expected reference, got ${typeof x}`);
    }
    if (typeof x.id !== 'string') {
      return notOk.BadRequest(`${prefix}.id: expected string, got ${typeof x.id}`);
    }
    return ok(x.id);
  },
  decodeData: (x) => ({ id: x }),
  getReferenceUUIDs: (x) => (x ? [x.id] : null),
};

const stringCodec: FieldTypeAdapter<FieldValueTypeMap[FieldType.String], string> = {
  encodeData: (prefix: string, x) =>
    typeof x === 'string'
      ? ok(x)
      : notOk.BadRequest(`${prefix}: expected string, got ${Array.isArray(x) ? 'list' : typeof x}`),
  decodeData: (x) => x,
  getReferenceUUIDs: (unusedX) => null,
};

const invalidCodec: FieldTypeAdapter<FieldValueTypeMap[FieldType.ValueType], unknown> = {
  encodeData: (unusedPrefix, unusedData) => {
    throw new Error('Should not be used');
  },
  decodeData: (unusedData) => {
    throw new Error('Should not be used');
  },
  getReferenceUUIDs: (unusedData) => {
    throw new Error('Should not be used');
  },
};

const adapters: Record<FieldType, FieldTypeAdapter<unknown>> = {
  [FieldType.Reference]: referenceCodec,
  [FieldType.String]: stringCodec,
  [FieldType.ValueType]: invalidCodec,
};

export function getAdapter(fieldSpec: FieldSpecification): FieldTypeAdapter {
  const result = adapters[fieldSpec.type];
  if (!result) {
    throw new Error(`Can't find field type (${fieldSpec.type})`);
  }
  return result;
}
