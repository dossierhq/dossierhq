import { EntityStatus } from '@dossierhq/core';
import type { DatabaseEntityFieldsPayload } from '@dossierhq/database-adapter';
import type { EntitiesTable, EntityVersionsTable } from '../DatabaseSchema.js';
import { assertExhaustive } from './AssertUtils.js';

export function resolveEntityStatus(status: EntitiesTable['status']): EntityStatus {
  switch (status) {
    case 'draft':
      return EntityStatus.draft;
    case 'published':
      return EntityStatus.published;
    case 'modified':
      return EntityStatus.modified;
    case 'withdrawn':
      return EntityStatus.withdrawn;
    case 'archived':
      return EntityStatus.archived;
    default:
      assertExhaustive(status);
  }
}

export function resolveAdminEntityInfo(
  row: Pick<
    EntitiesTable,
    'auth_key' | 'created_at' | 'invalid' | 'name' | 'status' | 'type' | 'updated_at'
  > &
    Pick<EntityVersionsTable, 'version'> & { subjects_uuid?: string },
) {
  const status = resolveEntityStatus(row.status);
  return {
    ...resolveEntityValidity(row.invalid, status),
    authKey: row.auth_key,
    createdAt: row.created_at,
    name: row.name,
    status,
    type: row.type,
    updatedAt: row.updated_at,
    updatedBy: row.subjects_uuid,
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
    createdAt: row.created_at,
    validPublished: (row.invalid & 2) === 0,
  };
}

export function resolveEntityValidity(invalid: EntitiesTable['invalid'], status: EntityStatus) {
  return {
    valid: (invalid & 1) === 0,
    validPublished:
      status === EntityStatus.published || status === EntityStatus.modified
        ? (invalid & 2) === 0
        : null,
  };
}

export function resolveEntityFields(
  row: Pick<EntityVersionsTable, 'schema_version' | 'encode_version' | 'data'>,
): {
  entityFields: DatabaseEntityFieldsPayload;
} {
  return {
    entityFields: {
      fields: row.data,
      schemaVersion: row.schema_version,
      encodeVersion: row.encode_version,
    },
  };
}
