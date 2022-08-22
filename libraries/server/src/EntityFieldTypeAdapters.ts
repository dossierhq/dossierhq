import type {
  AdminFieldSpecification,
  ErrorType,
  FieldValueTypeMap,
  Result,
} from '@jonasb/datadata-core';
import { FieldType, notOk, ok } from '@jonasb/datadata-core';

export interface FieldTypeAdapter<TDecoded = unknown, TEncoded = unknown> {
  encodeData(
    fieldSpec: AdminFieldSpecification,
    prefix: string,
    decodedData: TDecoded
  ): Result<TEncoded, typeof ErrorType.BadRequest>;
  decodeData(encodedData: TEncoded): TDecoded;
  getReferenceUUIDs(decodedData: TDecoded): null | string[];
}

const booleanCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Boolean], boolean> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, prefix: string, data) =>
    typeof data === 'boolean'
      ? ok(data)
      : notOk.BadRequest(
          `${prefix}: expected boolean, got ${Array.isArray(data) ? 'list' : typeof data}`
        ),
  decodeData: (x) => x,
  getReferenceUUIDs: (_x) => null,
};

const entityTypeCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.EntityType], string> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, prefix: string, x) => {
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

const locationCodec: FieldTypeAdapter<
  FieldValueTypeMap[typeof FieldType.Location],
  [number, number]
> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, prefix: string, data) => {
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

const stringCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.String], string> = {
  encodeData: (fieldSpec: AdminFieldSpecification, prefix: string, data) => {
    if (typeof data !== 'string') {
      return notOk.BadRequest(
        `${prefix}: expected string, got ${Array.isArray(data) ? 'list' : typeof data}`
      );
    }
    if (!fieldSpec.multiline && data.includes('\n')) {
      return notOk.BadRequest(`${prefix}: multiline string not allowed`);
    }
    return ok(data);
  },
  decodeData: (x) => x,
  getReferenceUUIDs: (_x) => null,
};

const invalidCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.ValueType], unknown> = {
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
  [FieldType.Boolean]: booleanCodec,
  [FieldType.EntityType]: entityTypeCodec,
  [FieldType.Location]: locationCodec,
  [FieldType.RichText]: invalidCodec,
  [FieldType.String]: stringCodec,
  [FieldType.ValueType]: invalidCodec,
};

export function getAdapter(fieldSpec: AdminFieldSpecification): FieldTypeAdapter {
  return getAdapterForType(fieldSpec.type as FieldType);
}

export function getAdapterForType(fieldType: keyof typeof FieldType): FieldTypeAdapter {
  const result = adapters[fieldType];
  if (!result) {
    throw new Error(`Can't find field type (${fieldType})`);
  }
  return result;
}
