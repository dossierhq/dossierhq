import {
  EntityFieldSpecification,
  EntityFieldType,
} from './TypeSpecifications';

export interface EntityFieldTypeAdapter {
  getData(rawData: unknown): unknown;
  name: EntityFieldType;
}

const adapters: EntityFieldTypeAdapter[] = [];

adapters.push({
  name: EntityFieldType.BasicString,
  getData: (x) => JSON.stringify(x),
});

export function getAdapter(
  fieldSpec: EntityFieldSpecification
): EntityFieldTypeAdapter {
  const result = adapters.find((x) => x.name === fieldSpec.type);
  if (!result) {
    throw new Error(`Can't find field type (${name})`);
  }
  return result;
}
