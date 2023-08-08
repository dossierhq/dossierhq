import type { AdminEntityTypeSpecification, AdminSchema, ContentValuePath } from '@dossierhq/core';
import { legacyEncodeEntityFields } from './legacyEncodeEntityFields.js';

export function encodeEntityFields(
  adminSchema: AdminSchema,
  entitySpec: AdminEntityTypeSpecification,
  path: ContentValuePath,
  fields: Record<string, unknown>,
): { encodeVersion: number; fields: Record<string, unknown> } {
  const encodeVersion = 0;
  const encodedFields = legacyEncodeEntityFields(adminSchema, entitySpec, path, fields);
  return { encodeVersion, fields: encodedFields };
}
