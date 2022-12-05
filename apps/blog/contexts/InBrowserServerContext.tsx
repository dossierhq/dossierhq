import { NoOpLogger } from '@jonasb/datadata-core';
import { createSqlJsAdapter } from '@jonasb/datadata-database-adapter-sqlite-sql.js';
import type { Server } from '@jonasb/datadata-server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@jonasb/datadata-server';
import { createContext, useEffect, useState } from 'react';
import initSqlJs from 'sql.js/dist/sql-wasm';

export interface InBrowserDatabaseContextValue {
  server: Server | null;
}

export const InBrowserServerContext = createContext<InBrowserDatabaseContextValue | null>(null);

const INITIALIZING_VALUE: InBrowserDatabaseContextValue = { server: null };

export function InBrowserServerProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [value, setValue] = useState<InBrowserDatabaseContextValue | null>(
    enabled ? INITIALIZING_VALUE : null
  );

  useEffect(() => {
    if (enabled) {
      initializeServer().then(setValue);
    }
  }, [enabled]);

  return (
    <InBrowserServerContext.Provider value={value}>{children}</InBrowserServerContext.Provider>
  );
}

async function initializeServer(): Promise<{ server: Server }> {
  const sqlPromise = initSqlJs({ locateFile: (_file) => '/sql-wasm.wasm' });
  const dbFilePromise = fetch('/database.sqlite')
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
