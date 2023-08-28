import type { EventType } from '@dossierhq/core';

export interface AdvisoryLocksTable {
  id: number;
  name: string;
  acquired_at: string;
  renewed_at: string;
  expires_at: number;
  lease_duration: number;
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
  auth_key: string;
  resolved_auth_key: string;
  status: 'draft' | 'published' | 'modified' | 'withdrawn' | 'archived';
  never_published: number; // boolean
  dirty: number; // bit field, ENTITY_DIRTY_FLAG_*
  invalid: number; // bit field 0x1 = latest, 0x2 = published
  created_at: string;
  updated_at: string;
  updated_seq: number;
  latest_entity_versions_id: number | null;
  published_entity_versions_id: number | null;
}

export interface EntityLatestReferencesTable {
  id: number;
  from_entities_id: number;
  to_entities_id: number;
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

export interface EntityPublishingEventsTable {
  id: number;
  entities_id: number;
  entity_versions_id: number | null;
  kind: 'publish' | 'unpublish' | 'archive' | 'unarchive';
  published_by: number;
  published_at: string;
}

export interface EntityVersionsTable {
  id: number;
  entities_id: number;
  type: string;
  name: string;
  version: number;
  created_at: string;
  created_by: number;
  schema_version: number;
  encode_version: number;
  fields: string;
}

export interface EventsTable {
  id: number;
  type: keyof typeof EventType;
  created_at: string;
}

export interface EventEntityVersionsTable {
  id: number;
  events_id: number;
  entity_versions_id: number;
  published_name: string | null;
}

export interface SequencesTable {
  name: string;
  value: number;
}

export interface SubjectsTable {
  id: number;
  uuid: string;
  created_at: string;
}

export interface PrincipalsTable {
  id: number;
  provider: string;
  identifier: string;
  subjects_id: number;
}

export interface SchemaVersionsTable {
  id: number;
  version: number;
  updated_at: string;
  specification: string;
}

export interface UniqueIndexValuesTable {
  id: number;
  entities_id: number;
  index_name: string;
  value: string;
  latest: number; // boolean
  published: number; // boolean
}

export interface UniqueConstraint {
  table: string;
  columns: string[];
}

const AdvisoryLocksTable = 'advisory_locks';
const EntitiesTable = 'entities';
const PrincipalsTable = 'principals';
const UniqueIndexValuesTable = 'unique_index_values';

export const AdvisoryLocksUniqueNameConstraint: UniqueConstraint = {
  table: AdvisoryLocksTable,
  columns: ['name'],
};

export const EntitiesUniqueNameConstraint: UniqueConstraint = {
  table: EntitiesTable,
  columns: ['name'],
};

export const EntitiesUniquePublishedNameConstraint: UniqueConstraint = {
  table: EntitiesTable,
  columns: ['published_name'],
};

export const EntitiesUniqueUuidConstraint: UniqueConstraint = {
  table: EntitiesTable,
  columns: ['uuid'],
};

export const PrincipalsUniqueProviderIdentifierConstraint: UniqueConstraint = {
  table: PrincipalsTable,
  columns: ['provider', 'identifier'],
};

export const UniqueIndexValueConstraint: UniqueConstraint = {
  table: UniqueIndexValuesTable,
  columns: ['index_name', 'value'],
};
