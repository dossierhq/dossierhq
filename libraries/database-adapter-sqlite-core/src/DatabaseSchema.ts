export interface AdvisoryLocksTable {
  id: number;
  name: string;
  acquired_at: string;
  renewed_at: string;
  expires_at: number;
  lease_duration: number;
}

export interface EntitiesTable {
  id: number;
  uuid: string;
  name: string;
  type: string;
  auth_key: string;
  resolved_auth_key: string;
  status: 'draft' | 'published' | 'modified' | 'withdrawn' | 'archived';
  never_published: boolean;
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

export interface EntityPublishingEventsTable {
  id: number;
  entities_id: number;
  entity_versions_id: number | null;
  kind: 'publish' | 'unpublish' | 'archive' | 'unarchive';
  published_by: number;
  published_at: string;
}

export interface EntityUniqueIndexesTable {
  id: number;
  entities_id: number;
  index_name: string;
  value: string;
  latest: boolean;
  published: boolean;
}

export interface EntityVersionsTable {
  id: number;
  entities_id: number;
  version: number;
  created_at: string;
  created_by: number;
  fields: string;
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
  specification: string;
}

export interface UniqueConstraint {
  table: string;
  columns: string[];
}

const AdvisoryLocksTable = 'advisory_locks';
const EntitiesTable = 'entities';
const EntityUniqueIndexesTable = 'entity_unique_indexes';
const PrincipalsTable = 'principals';

export const AdvisoryLocksUniqueNameConstraint: UniqueConstraint = {
  table: AdvisoryLocksTable,
  columns: ['name'],
};

export const EntitiesUniqueNameConstraint: UniqueConstraint = {
  table: EntitiesTable,
  columns: ['name'],
};

export const EntitiesUniqueUuidConstraint: UniqueConstraint = {
  table: EntitiesTable,
  columns: ['uuid'],
};

export const EntitiesUniqueIndexValueConstraint: UniqueConstraint = {
  table: EntityUniqueIndexesTable,
  columns: ['index_name', 'value'],
};

export const PrincipalsUniqueProviderIdentifierConstraint: UniqueConstraint = {
  table: PrincipalsTable,
  columns: ['provider', 'identifier'],
};
