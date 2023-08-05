import {
  FieldType,
  type AdminFieldSpecification,
  type EntityReference,
  type FieldSpecification,
  type FieldValueTypeMap,
  type ItemValuePath,
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
    path: ItemValuePath,
    decodedData: TDecoded,
  ): EncodedValue<TEncoded | null>;
  decodeData(encodedData: TEncoded): TDecoded;
  decodeJson(json: unknown): TDecoded;
}

const booleanCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Boolean], boolean> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, path: ItemValuePath, data) =>
    typeof data === 'boolean'
      ? { encodedValue: data, validationIssues: [] }
      : {
          encodedValue: null,
          validationIssues: [
            {
              type: 'save',
              path,
              message: `Expected boolean, got ${Array.isArray(data) ? 'list' : typeof data}`,
            },
          ],
        },
  decodeData: (it) => it,
  decodeJson: (json) => json as boolean,
};

const entityTypeCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Entity], string> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, path: ItemValuePath, data) => {
    if (Array.isArray(data)) {
      return {
        encodedValue: null,
        validationIssues: [{ type: 'save', path, message: `Expected entity reference, got list` }],
      };
    }
    if (typeof data !== 'object') {
      return {
        encodedValue: null,
        validationIssues: [
          {
            type: 'save',
            path,
            message: `Expected entity reference, got ${typeof data}`,
          },
        ],
      };
    }
    if (typeof data.id !== 'string') {
      return {
        encodedValue: null,
        validationIssues: [
          {
            type: 'save',
            path: [...path, 'id'],
            message: `Expected string, got ${typeof data.id}`,
          },
        ],
      };
    }
    return { encodedValue: data.id, validationIssues: [] };
  },
  decodeData: (it) => ({ id: it }),
  decodeJson: (json) => json as EntityReference,
};

const locationCodec: FieldTypeAdapter<
  FieldValueTypeMap[typeof FieldType.Location],
  [number, number]
> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, path: ItemValuePath, data) => {
    if (Array.isArray(data)) {
      return {
        encodedValue: null,
        validationIssues: [{ type: 'save', path, message: `Expected location, got list` }],
      };
    }
    if (typeof data !== 'object') {
      return {
        encodedValue: null,
        validationIssues: [
          {
            type: 'save',
            path,
            message: `Expected location object, got ${typeof data}`,
          },
        ],
      };
    }
    const { lat, lng } = data;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      const validationIssues: SaveValidationIssue[] = [];
      if (typeof lat !== 'number' && typeof lng !== 'number') {
        validationIssues.push({
          type: 'save',
          path,
          // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
          message: `Expected {lat: number, lng: number}, got ${data}`,
        });
      } else if (typeof lat !== 'number') {
        validationIssues.push({
          type: 'save',
          path: [...path, 'lat'],
          message: `Expected number, got ${typeof lat}`,
        });
      } else {
        validationIssues.push({
          type: 'save',
          path: [...path, 'lng'],
          message: `Expected number, got ${typeof lng}`,
        });
      }
      return { encodedValue: null, validationIssues };
    }
    return { encodedValue: [lat, lng], validationIssues: [] };
  },
  decodeData: ([lat, lng]) => ({ lat, lng }),
  decodeJson: (json) => json as Location,
};

const numberCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.Number], number> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, path: ItemValuePath, data) =>
    typeof data === 'number'
      ? { encodedValue: data, validationIssues: [] }
      : {
          encodedValue: null,
          validationIssues: [
            {
              type: 'save',
              path,
              message: `Expected number, got ${Array.isArray(data) ? 'list' : typeof data}`,
            },
          ],
        },
  decodeData: (it) => it,
  decodeJson: (json) => json as number,
};

const stringCodec: FieldTypeAdapter<FieldValueTypeMap[typeof FieldType.String], string> = {
  encodeData: (_fieldSpec: AdminFieldSpecification, path: ItemValuePath, data) => {
    if (typeof data !== 'string') {
      return {
        encodedValue: null,
        validationIssues: [
          {
            type: 'save',
            path,
            message: `Expected string, got ${Array.isArray(data) ? 'list' : typeof data}`,
          },
        ],
      };
    }

    return { encodedValue: data, validationIssues: [] };
  },
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
