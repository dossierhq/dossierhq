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

const PrincipalsTable = 'principals';

export const PrincipalsUniqueProviderIdentifier: UniqueConstraint = {
  table: PrincipalsTable,
  columns: ['provider', 'identifier'],
};
