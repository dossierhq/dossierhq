import {
  EntityFieldSpecification,
  EntityFieldType,
} from './TypeSpecifications';

export interface EntityFieldTypeAdapter {
  encodeData(rawData: unknown): unknown;
  decodeData(data: unknown): unknown;
  getReferenceUUIDs(rawData: unknown): null | string[];
  name: EntityFieldType;
}

const adapters: EntityFieldTypeAdapter[] = [];

adapters.push(
  {
    name: EntityFieldType.BasicString,
    encodeData: (x) => JSON.stringify(x),
    decodeData: (x) => x,
    getReferenceUUIDs: (rawData) => null,
  },
  {
    name: EntityFieldType.Reference,
    encodeData: (x: { uuid: string }) => JSON.stringify(x.uuid),
    decodeData: (x: string) => ({ uuid: x }),
    getReferenceUUIDs: (x: { uuid: string }) => [x.uuid],
  },
  {
    name: EntityFieldType.ReferenceSet,
    encodeData: (x: { uuid: string }[]) =>
      JSON.stringify(x.map((ref) => ref.uuid)),
    decodeData: (x: string[]) => x.map((uuid) => ({ uuid })),
    getReferenceUUIDs: (x: { uuid: string }[]) => x.map((ref) => ref.uuid),
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
