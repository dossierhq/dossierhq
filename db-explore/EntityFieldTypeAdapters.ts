import {
  EntityFieldSpecification,
  EntityFieldType,
} from './TypeSpecifications';

export interface EntityFieldTypeAdapter {
  encodeData(rawData: unknown): unknown;
  decodeData(data: unknown): unknown;
  name: EntityFieldType;
}

const adapters: EntityFieldTypeAdapter[] = [];

adapters.push(
  {
    name: EntityFieldType.BasicString,
    encodeData: (x) => JSON.stringify(x),
    decodeData: (x) => x,
  },
  {
    name: EntityFieldType.Reference,
    encodeData: (x) => JSON.stringify(x),
    decodeData: (x) => x,
  }
);

export function getAdapter(
  fieldSpec: EntityFieldSpecification
): EntityFieldTypeAdapter {
  const result = adapters.find((x) => x.name === fieldSpec.type);
  if (!result) {
    throw new Error(`Can't find field type (${name})`);
  }
  return result;
}
