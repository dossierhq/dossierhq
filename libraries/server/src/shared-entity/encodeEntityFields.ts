import type { AdminEntityTypeSpecification, AdminSchema, ContentValuePath } from '@dossierhq/core';
import { ENCODE_VERSION_AS_IS } from './migrateDecodeAndNormalizeEntityFields.js';

//TODO remove unused parameters and delete legacy encode
export function encodeEntityFields(
  _adminSchema: AdminSchema,
  _entitySpec: AdminEntityTypeSpecification,
  _path: ContentValuePath,
  fields: Record<string, unknown>,
): { encodeVersion: number; fields: Record<string, unknown> } {
  return { encodeVersion: ENCODE_VERSION_AS_IS, fields };
}
