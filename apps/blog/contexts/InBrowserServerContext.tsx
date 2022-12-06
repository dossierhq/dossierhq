import { NoOpLogger } from '@jonasb/datadata-core';
import { createSqlJsAdapter } from '@jonasb/datadata-database-adapter-sqlite-sql.js';
import type { Server } from '@jonasb/datadata-server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@jonasb/datadata-server';
import { createContext, useEffect, useState } from 'react';
import initSqlJs from 'sql.js/dist/sql-wasm';
import { IN_BROWSER_DATABASE_URL } from '../config/InBrowserServerConfig';

export interface InBrowserDatabaseContextValue {
  server: Server | null;
}

export const InBrowserServerContext = createContext<InBrowserDatabaseContextValue | null>(null);

const INITIALIZING_VALUE: InBrowserDatabaseContextValue = { server: null };

export function InBrowserServerProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<InBrowserDatabaseContextValue | null>(
    IN_BROWSER_DATABASE_URL ? INITIALIZING_VALUE : null
  );

  useEffect(() => {
    if (IN_BROWSER_DATABASE_URL) {
      initializeServer(IN_BROWSER_DATABASE_URL).then(setValue);
    }
  }, []);

  return (
    <InBrowserServerContext.Provider value={value}>{children}</InBrowserServerContext.Provider>
  );
}

async function initializeServer(databaseUrl: string): Promise<{ server: Server }> {
  const sqlPromise = initSqlJs({ locateFile: (_file) => '/sql-wasm.wasm' });
  const dbFilePromise = fetch(databaseUrl)
    .then((it) => it.arrayBuffer())
    .then((it) => new Uint8Array(it));
  const [SQL, dbFile] = await Promise.all([sqlPromise, dbFilePromise]);
  const database = new SQL.Database(dbFile);
  const adapterResult = await createSqlJsAdapter({ logger: NoOpLogger }, database, {
    migrate: true,
    fts: { version: 'fts4' },
    journalMode: 'memory',
  });

  const serverResult = await createServer({
    databaseAdapter: adapterResult.valueOrThrow(),
    authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
  });
  const server = serverResult.valueOrThrow();
  return { server };
}
