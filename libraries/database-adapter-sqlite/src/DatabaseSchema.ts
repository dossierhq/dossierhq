export interface EntitiesTable {
  id: number;
  uuid: string;
  name: string;
  type: string;
  auth_key: string;
  resolved_auth_key: string;
  status: 'draft' | 'published' | 'modified' | 'withdrawn' | 'archived';
  created_at: string;
  updated_at: string;
  latest_entity_versions_id: number | null;
}

export interface EntityVersionsTable {
  id: number;
  entities_id: number;
  version: number;
  created_by: number;
  fields: string;
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

const EntitiesTable = 'entities';
const PrincipalsTable = 'principals';

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
