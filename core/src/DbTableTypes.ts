import type { EntityTypeSpecification } from '.';

export interface EntityTypesTable {
  id: number;
  name: string;
  specification: EntityTypeSpecification;
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
  latest_draft_entity_versions_id: number | null;
  published_deleted: boolean;
  published_entity_versions_id: number | null;
}

export interface EntityVersionsTable {
  id: number;
  entities_id: number;
  version: number;
  created_at: Date;
  created_by: number;
  data: Record<string, unknown> | null;
}

export interface EntityVersionReferencesTable {
  id: number;
  entity_versions_id: number;
  entities_id: number;
}
