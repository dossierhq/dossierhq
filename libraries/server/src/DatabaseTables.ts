import type { SchemaSpecification } from '@jonasb/datadata-core';

export interface SchemaVersionsTable {
  id: number;
  specification: SchemaSpecification;
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
  archived: boolean;
  published_entity_versions_id: number | null;
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
