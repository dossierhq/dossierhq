import { AdminEntityStatus } from '@dossierhq/core';
import type { DatabaseEntityFieldsPayload } from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import { assertExhaustive } from './AssertUtils.js';

export function resolveEntityStatus(status: EntitiesTable['status']): AdminEntityStatus {
  switch (status) {
    case 'draft':
      return AdminEntityStatus.draft;
    case 'published':
      return AdminEntityStatus.published;
    case 'modified':
      return AdminEntityStatus.modified;
    case 'withdrawn':
      return AdminEntityStatus.withdrawn;
    case 'archived':
      return AdminEntityStatus.archived;
    default:
      assertExhaustive(status);
  }
}

export function resolveAdminEntityInfo(
  row: Pick<
    EntitiesTable,
    'auth_key' | 'created_at' | 'invalid' | 'name' | 'status' | 'type' | 'updated_at'
  > &
    Pick<EntityVersionsTable, 'version'>,
) {
  const status = resolveEntityStatus(row.status);
  return {
    ...resolveEntityValidity(row.invalid, status),
    authKey: row.auth_key,
    createdAt: new Date(row.created_at),
    name: row.name,
    status,
    type: row.type,
    updatedAt: new Date(row.updated_at),
    version: row.version,
  };
}

export function resolvePublishedEntityInfo(
  row: Pick<EntitiesTable, 'type' | 'published_name' | 'auth_key' | 'created_at' | 'invalid'>,
) {
  const name = row.published_name;
  if (name === null) {
    throw new Error('Unexpected null published name');
  }
  return {
    type: row.type,
    name,
    authKey: row.auth_key,
    createdAt: new Date(row.created_at),
    validPublished: (row.invalid & 2) === 0,
  };
}

export function resolveEntityValidity(
  invalid: EntitiesTable['invalid'],
  status: AdminEntityStatus,
) {
  return {
    valid: (invalid & 1) === 0,
    validPublished:
      status === AdminEntityStatus.published || status === AdminEntityStatus.modified
        ? (invalid & 2) === 0
        : null,
  };
}

export function resolveEntityFields(
  row: Pick<EntityVersionsTable, 'schema_version' | 'encode_version' | 'fields'>,
): {
  entityFields: DatabaseEntityFieldsPayload;
} {
  return {
    entityFields: {
      schemaVersion: row.schema_version,
      encodeVersion: row.encode_version,
      fields: JSON.parse(row.fields) as Record<string, unknown>,
    },
  };
}
