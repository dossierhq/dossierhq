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
  never_published: number; // boolean
  dirty: number; // bit field 0x1 = validate_latest, 0x2 = validate_published, 0x4 = index_latest, 0x8 = index_published
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
