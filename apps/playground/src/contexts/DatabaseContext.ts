import { createContext } from 'react';
import type { Database } from 'sql.js';

export interface DatabaseContextValue {
  database: Database | null;
  createDatabase(data: Uint8Array | null): Promise<void>;
  clearDatabase(): void;
}

export const DatabaseContext = createContext<DatabaseContextValue>({
  defaultDatabaseContextValue: true,
} as unknown as DatabaseContextValue);
