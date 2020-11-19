import type { EntityFieldSpecification } from '.';
import { EntityFieldType } from './Schema';

export interface EntityFieldTypeAdapter<TDecoded = unknown, TEncoded = unknown> {
  encodeData(decodedData: TDecoded): TEncoded;
  decodeData(encodedData: TEncoded): TDecoded;
  getReferenceUUIDs(decodedData: TDecoded): null | string[];
}

const referenceCodec: EntityFieldTypeAdapter<{ id: string } | null, string | null> = {
  encodeData: (x) => (x ? x.id : null),
  decodeData: (x) => (x ? { id: x } : null),
  getReferenceUUIDs: (x) => (x ? [x.id] : null),
};

const stringCodec: EntityFieldTypeAdapter<string | null, string | null> = {
  encodeData: (x) => x,
  decodeData: (x) => x,
  getReferenceUUIDs: (unusedX) => null,
};

const adapters: Record<EntityFieldType, EntityFieldTypeAdapter> = {
  [EntityFieldType.Reference]: referenceCodec,
  [EntityFieldType.String]: stringCodec,
};

export function getAdapter(fieldSpec: EntityFieldSpecification): EntityFieldTypeAdapter {
  const result = adapters[fieldSpec.type];
  if (!result) {
    throw new Error(`Can't find field type (${fieldSpec.type})`);
  }
  return result;
}
