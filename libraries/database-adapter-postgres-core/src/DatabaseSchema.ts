import type { DatabaseTables } from '@jonasb/datadata-server';

export enum UniqueConstraints {
  principals_provider_identifier_key = 'principals_provider_identifier_key',
}

export type SchemaVersionsTable = DatabaseTables.SchemaVersionsTable;
export type SubjectsTable = DatabaseTables.SubjectsTable;
