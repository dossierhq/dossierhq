import { ENCODE_VERSION_AS_IS } from './migrateDecodeAndNormalizeEntityFields.js';

export function encodeEntityFields(fields: Record<string, unknown>): {
  encodeVersion: number;
  fields: Record<string, unknown>;
} {
  return { encodeVersion: ENCODE_VERSION_AS_IS, fields };
}
