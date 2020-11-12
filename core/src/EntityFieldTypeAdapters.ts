import type { EntityFieldSpecification } from '.';
import { EntityFieldType } from './Schema';

export interface EntityFieldTypeAdapter {
  encodeData(rawData: unknown): unknown;
  decodeData(data: unknown): unknown;
}

const adapters: Record<EntityFieldType, EntityFieldTypeAdapter> = {
  [EntityFieldType.String]: {
    encodeData: (x) => x,
    decodeData: (x) => x,
  },
};

export function getAdapter(fieldSpec: EntityFieldSpecification): EntityFieldTypeAdapter {
  const result = adapters[fieldSpec.type];
  if (!result) {
    throw new Error(`Can't find field type (${fieldSpec.type})`);
  }
  return result;
}
