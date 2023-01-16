import type {
  AdminFieldSpecification,
  EntityReference,
  ErrorType,
  FieldSpecification,
  FieldValueTypeMap,
  Location,
  Result,
} from '@dossierhq/core';
import { FieldType, notOk, ok } from '@dossierhq/core';

export interface FieldTypeAdapter<TDecoded = unknown, TEncoded = unknown> {
  encodeData(
    fieldSpec: AdminFieldSpecification,
    prefix: string,
    decodedData: TDecoded
  ): Result<TEncoded, typeof ErrorType.BadRequest>;
  decodeData(encodedData: TEncoded): TDecoded;
  decodeJson(json: unknown): TDecoded;
}

const booleanCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Boolean], boolean> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, prefix: string, data) =>
    typeof data === 'boolean'
      ? ok(data)
      : notOk.BadRequest(
          `${prefix}: expected boolean, got ${Array.isArray(data) ? 'list' : typeof data}`
        ),
  decodeData: (x) => x,
  decodeJson: (json) => json as boolean,
};

const entityTypeCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Entity], string> = {
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
  decodeData: (it) => ({ id: it }),
  decodeJson: (json) => json as EntityReference,
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
  decodeJson: (json) => json as Location,
};

const numberCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Number], number> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, prefix: string, data) =>
    typeof data === 'number'
      ? ok(data)
      : notOk.BadRequest(
          `${prefix}: expected number, got ${Array.isArray(data) ? 'list' : typeof data}`
        ),
  decodeData: (it) => it,
  decodeJson: (json) => json as number,
};

const stringCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.String], string> = {
  encodeData: (fieldSpec: AdminFieldSpecification, prefix: string, data) => {
    if (typeof data !== 'string') {
      return notOk.BadRequest(
        `${prefix}: expected string, got ${Array.isArray(data) ? 'list' : typeof data}`
      );
    }
    if (fieldSpec.type === FieldType.String && !fieldSpec.multiline && data.includes('\n')) {
      return notOk.BadRequest(`${prefix}: multiline string not allowed`);
    }
    return ok(data);
  },
  decodeData: (x) => x,
  decodeJson: (json) => json as string,
};

const invalidCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.ValueItem], unknown> = {
  encodeData: (_prefix, _data) => {
    throw new Error('Should not be used');
  },
  decodeData: (_data) => {
    throw new Error('Should not be used');
  },
  decodeJson: (_json) => {
    throw new Error('Should not be used');
  },
};

const adapters: Record<FieldType, FieldTypeAdapter<unknown>> = {
  [FieldType.Boolean]: booleanCodec,
  [FieldType.Entity]: entityTypeCodec,
  [FieldType.Location]: locationCodec,
  [FieldType.Number]: numberCodec,
  [FieldType.RichText]: invalidCodec,
  [FieldType.String]: stringCodec,
  [FieldType.ValueItem]: invalidCodec,
};

export function getAdapter(fieldSpec: FieldSpecification): FieldTypeAdapter {
  return getAdapterForType(fieldSpec.type as FieldType);
}

export function getAdapterForType(
  fieldType: (typeof FieldType)[keyof typeof FieldType]
): FieldTypeAdapter {
  const result = adapters[fieldType];
  if (!result) {
    throw new Error(`Can't find field type (${fieldType})`);
  }
  return result;
}
