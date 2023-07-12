import { createContext } from 'react';
import type { Database } from 'sql.js';

export interface DatabaseContextValue {
  database: Database | null;
  createDatabase(this: void, data: Uint8Array | null): Promise<void>;
  clearDatabase(this: void): void;
}

export const DatabaseContext = createContext<DatabaseContextValue>({
  defaultDatabaseContextValue: true,
} as unknown as DatabaseContextValue);
