import {
  FieldType,
  type EntityReference,
  type FieldSpecification,
  type FieldValueTypeMap,
  type Location,
} from '@dossierhq/core';

export interface FieldTypeAdapter<TDecoded = unknown, TEncoded = unknown> {
  decodeData(encodedData: TEncoded): TDecoded;
  decodeJson(json: unknown): TDecoded;
}

const booleanCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Boolean], boolean> = {
  decodeData: (it) => it,
  decodeJson: (json) => json as boolean,
};

const entityTypeCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Entity], string> = {
  decodeData: (it) => ({ id: it }),
  decodeJson: (json) => json as EntityReference,
};

const locationCodec: FieldTypeAdapter<
  FieldValueTypeMap[typeof FieldType.Location],
  [number, number]
> = {
  decodeData: ([lat, lng]) => ({ lat, lng }),
  decodeJson: (json) => json as Location,
};

const numberCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Number], number> = {
  decodeData: (it) => it,
  decodeJson: (json) => json as number,
};

const stringCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.String], string> = {
  decodeData: (it) => it,
  decodeJson: (json) => json as string,
};

const invalidCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.ValueItem], unknown> = {
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
  const payload = adapters[fieldType];
  if (!payload) {
    throw new Error(`Can't find field type (${fieldType})`);
  }
  return payload;
}
