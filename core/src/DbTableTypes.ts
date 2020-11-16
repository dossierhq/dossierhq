export interface SubjectsTableFields {
  id: number;
  uuid: string;
  created_at: Date;
}

export interface EntitiesTableFields {
  id: number;
  uuid: string;
  name: string;
  type: string;
  published_deleted: boolean;
  published_entity_versions_id: number | null;
}

export interface EntityVersionsTableFields {
  id: number;
  entities_id: number;
  version: number;
  created_at: Date;
  created_by: number;
  data: Record<string, unknown> | null;
}
