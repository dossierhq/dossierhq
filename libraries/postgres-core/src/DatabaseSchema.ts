import type { SchemaSpecificationWithMigrations, EventType } from '@dossierhq/core';

export const UniqueConstraints = {
  advisory_locks_name_key: 'advisory_locks_name_key',
  entities_name_key: 'entities_name_key',
  entities_published_name_key: 'entities_published_name_key',
  entities_uuid_key: 'entities_uuid_key',
  principals_provider_identifier_key: 'principals_provider_identifier_key',
  schema_versions_version_key: 'schema_versions_version_key',
  unique_index_values_index_name_value_key: 'unique_index_values_index_name_value_key',
} as const;
export type UniqueConstraints = (typeof UniqueConstraints)[keyof typeof UniqueConstraints];

export interface AdvisoryLocksTable {
  id: number;
  name: string;
  acquired_at: string;
  renewed_at: string;
  lease_duration: number;
}

export interface SchemaVersionsTable {
  id: number;
  version: number;
  updated_at: Date;
  specification: Omit<SchemaSpecificationWithMigrations, 'version'>;
}

export interface SubjectsTable {
  id: number;
  uuid: string;
  created_at: Date;
}

export interface PrincipalsTable {
  id: number;
  provider: string;
  identifier: string;
  subjects_id: number;
}

export const ENTITY_DIRTY_FLAG_VALIDATE_LATEST = 0x1;
export const ENTITY_DIRTY_FLAG_VALIDATE_PUBLISHED = 0x2;
export const ENTITY_DIRTY_FLAG_INDEX_LATEST = 0x4;
export const ENTITY_DIRTY_FLAG_INDEX_PUBLISHED = 0x8;

export interface EntitiesTable {
  id: number;
  uuid: string;
  name: string;
  published_name: string | null;
  type: string;
  created_at: Date;
  updated_at: Date;
  updated: number;
  latest_draft_entity_versions_id: number | null;
  never_published: boolean;
  archived: boolean; // TODO remove and rely on status instead
  published_entity_versions_id: number | null;
  status: 'draft' | 'published' | 'modified' | 'withdrawn' | 'archived';
  dirty: number; // bit field, ENTITY_DIRTY_FLAG_*
  invalid: number; // bit field 0x1 = latest, 0x2 = published
  auth_key: string;
  resolved_auth_key: string;
}

export interface EntityPublishedReferencesTable {
  id: number;
  from_entities_id: number;
  to_entities_id: number;
}

export interface EntityLatestValueTypesTable {
  id: number;
  entities_id: number;
  value_type: string;
}

export interface EntityPublishedValueTypesTable {
  id: number;
  entities_id: number;
  value_type: string;
}

export interface EntityVersionsTable {
  id: number;
  entities_id: number;
  type: string;
  name: string;
  version: number;
  schema_version: number;
  encode_version: number;
  created_at: Date;
  created_by: number;
  data: Record<string, unknown>;
}

export interface EntityVersionReferencesTable {
  id: number;
  entity_versions_id: number;
  entities_id: number;
}

export interface EventsTable {
  id: number;
  uuid: string;
  type: keyof typeof EventType;
  created_at: Date;
}

export interface EventEntityVersionsTable {
  id: number;
  events_id: number;
  entity_versions_id: number;
  published_name: string | null;
}

export interface UniqueIndexValuesTable {
  id: number;
  entities_id: number;
  index_name: string;
  value: string;
  latest: boolean;
  published: boolean;
}
