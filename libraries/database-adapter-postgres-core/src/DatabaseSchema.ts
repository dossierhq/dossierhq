import type { AdminSchemaSpecification } from '@jonasb/datadata-core';

export const UniqueConstraints = {
  advisory_locks_name_key: 'advisory_locks_name_key',
  entities_name_key: 'entities_name_key',
  entities_uuid_key: 'entities_uuid_key',
  principals_provider_identifier_key: 'principals_provider_identifier_key',
  unique_index_values_index_name_value_key: 'unique_index_values_index_name_value_key',
} as const;
export type UniqueConstraints = keyof typeof UniqueConstraints;

export interface AdvisoryLocksTable {
  id: number;
  name: string;
  acquired_at: string;
  renewed_at: string;
  lease_duration: number;
}

export interface SchemaVersionsTable {
  id: number;
  specification: AdminSchemaSpecification;
}

export interface SubjectsTable {
  id: number;
  uuid: string;
  created_at: Date;
}

export interface EntitiesTable {
  id: number;
  uuid: string;
  name: string;
  type: string;
  created_at: Date;
  updated_at: Date;
  updated: number;
  latest_draft_entity_versions_id: number | null;
  never_published: boolean;
  archived: boolean; // TODO remove and rely on status instead
  published_entity_versions_id: number | null;
  status: 'draft' | 'published' | 'modified' | 'withdrawn' | 'archived';
  auth_key: string;
  resolved_auth_key: string;
}

export interface EntityPublishedReferencesTable {
  id: number;
  from_entities_id: number;
  to_entities_id: number;
}

export interface EntityVersionsTable {
  id: number;
  entities_id: number;
  version: number;
  created_at: Date;
  created_by: number;
  data: Record<string, unknown>;
}

export interface EntityVersionReferencesTable {
  id: number;
  entity_versions_id: number;
  entities_id: number;
}

export interface EntityPublishingEventsTable {
  id: number;
  entities_id: number;
  entity_versions_id: number | null;
  kind: 'publish' | 'unpublish' | 'archive' | 'unarchive';
  published_by: number;
  published_at: Date;
}

export interface UniqueIndexValuesTable {
  id: number;
  entities_id: number;
  index_name: string;
  value: string;
  latest: boolean;
  published: boolean;
}
