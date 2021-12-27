import type { DatabaseTables } from '@jonasb/datadata-server';

export enum UniqueConstraints {
  entities_name_key = 'entities_name_key',
  entities_uuid_key = 'entities_uuid_key',
  principals_provider_identifier_key = 'principals_provider_identifier_key',
}

export type EntitiesTable = DatabaseTables.EntitiesTable;
export type EntityVersionsTable = DatabaseTables.EntityVersionsTable;
export type SchemaVersionsTable = DatabaseTables.SchemaVersionsTable;
export type SubjectsTable = DatabaseTables.SubjectsTable;
