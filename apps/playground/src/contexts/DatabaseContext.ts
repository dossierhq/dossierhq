import { createContext } from 'react';
import { Database } from 'sql.js';

export interface DatabaseContextValue {
  database: Database | null;
  createDatabase(): void;
}

export const DatabaseContext = createContext<DatabaseContextValue>({
  defaultDatabaseContextValue: true,
} as unknown as DatabaseContextValue);
