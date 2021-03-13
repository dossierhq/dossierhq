import { FieldType, notOk, ok } from '@datadata/core';
import type { FieldSpecification, FieldValueTypeMap, Result, ErrorType } from '@datadata/core';

export interface FieldTypeAdapter<TDecoded = unknown, TEncoded = unknown> {
  encodeData(prefix: string, decodedData: TDecoded): Result<TEncoded, ErrorType.BadRequest>;
  decodeData(encodedData: TEncoded): TDecoded;
  getReferenceUUIDs(decodedData: TDecoded): null | string[];
}

const entityTypeCodec: FieldTypeAdapter<FieldValueTypeMap[FieldType.EntityType], string> = {
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

const locationCodec: FieldTypeAdapter<FieldValueTypeMap[FieldType.Location], [number, number]> = {
  encodeData: (prefix: string, data) => {
    if (Array.isArray(data)) {
      return notOk.BadRequest(`${prefix}: expected location, got list`);
    }
    if (typeof data !== 'object') {
      return notOk.BadRequest(`${prefix}: expected location object, got ${typeof data}`);
    }
    const { lat, lng } = data;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      if (typeof lat !== 'number' && typeof lng !== 'number') {
        return notOk.BadRequest(`${prefix}: expected {lat: number, lng: number}, got ${data}`);
      }
      if (typeof lat !== 'number') {
        return notOk.BadRequest(`${prefix}: expected lat to be number, got ${typeof lat}`);
      }
      return notOk.BadRequest(`${prefix}: expected lng to be number, got ${typeof lng}`);
    }
    return ok([lat, lng]);
  },
  decodeData: ([lat, lng]) => ({ lat, lng }),
  getReferenceUUIDs: (_data) => null,
};

const stringCodec: FieldTypeAdapter<FieldValueTypeMap[FieldType.String], string> = {
  encodeData: (prefix: string, x) =>
    typeof x === 'string'
      ? ok(x)
      : notOk.BadRequest(`${prefix}: expected string, got ${Array.isArray(x) ? 'list' : typeof x}`),
  decodeData: (x) => x,
  getReferenceUUIDs: (_x) => null,
};

const invalidCodec: FieldTypeAdapter<FieldValueTypeMap[FieldType.ValueType], unknown> = {
  encodeData: (_prefix, _data) => {
    throw new Error('Should not be used');
  },
  decodeData: (_data) => {
    throw new Error('Should not be used');
  },
  getReferenceUUIDs: (_data) => {
    throw new Error('Should not be used');
  },
};

const adapters: Record<FieldType, FieldTypeAdapter<unknown>> = {
  [FieldType.EntityType]: entityTypeCodec,
  [FieldType.Location]: locationCodec,
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
