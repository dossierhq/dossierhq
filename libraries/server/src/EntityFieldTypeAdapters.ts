import {
  FieldType,
  type AdminFieldSpecification,
  type ContentValuePath,
  type EntityReference,
  type FieldSpecification,
  type FieldValueTypeMap,
  type Location,
  type SaveValidationIssue,
} from '@dossierhq/core';

export interface EncodedValue<T = unknown> {
  encodedValue: T;
  validationIssues: SaveValidationIssue[];
}

export interface FieldTypeAdapter<TDecoded = unknown, TEncoded = unknown> {
  encodeData(
    fieldSpec: AdminFieldSpecification,
    path: ContentValuePath,
    decodedData: TDecoded,
  ): EncodedValue<TEncoded | null>;
  decodeData(encodedData: TEncoded): TDecoded;
  decodeJson(json: unknown): TDecoded;
}

const booleanCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Boolean], boolean> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, _path: ContentValuePath, data) => ({
    encodedValue: data,
    validationIssues: [],
  }),
  decodeData: (it) => it,
  decodeJson: (json) => json as boolean,
};

const entityTypeCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Entity], string> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, _path: ContentValuePath, data) => ({
    encodedValue: data.id,
    validationIssues: [],
  }),
  decodeData: (it) => ({ id: it }),
  decodeJson: (json) => json as EntityReference,
};

const locationCodec: FieldTypeAdapter<
  FieldValueTypeMap[typeof FieldType.Location],
  [number, number]
> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, _path: ContentValuePath, data) => ({
    encodedValue: [data.lat, data.lng],
    validationIssues: [],
  }),
  decodeData: ([lat, lng]) => ({ lat, lng }),
  decodeJson: (json) => json as Location,
};

const numberCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Number], number> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, _path: ContentValuePath, data) => ({
    encodedValue: data,
    validationIssues: [],
  }),
  decodeData: (it) => it,
  decodeJson: (json) => json as number,
};

const stringCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.String], string> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, _path: ContentValuePath, data) => ({
    encodedValue: data,
    validationIssues: [],
  }),
  decodeData: (it) => it,
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
  fieldType: (typeof FieldType)[keyof typeof FieldType],
): FieldTypeAdapter {
  const result = adapters[fieldType];
  if (!result) {
    throw new Error(`Can't find field type (${fieldType})`);
  }
  return result;
}
