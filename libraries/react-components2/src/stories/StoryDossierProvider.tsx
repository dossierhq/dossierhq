import {
  createConsoleLogger,
  LoggingClientMiddleware,
  type ClientContext,
  type DossierClient,
  type DossierClientMiddleware,
  type Logger,
} from '@dossierhq/core';
import { BackgroundEntityProcessorPlugin, createServer } from '@dossierhq/server';
import { createSqlJsAdapter } from '@dossierhq/sql.js';
import { useEffect, useState, type ReactNode } from 'react';
import type { Database, SqlJsStatic } from 'sql.js';
import initSqlJs from 'sql.js/dist/sql-wasm';
import sqlJsWasm from 'sql.js/dist/sql-wasm.wasm?url';
import { DossierProvider } from '../components/DossierProvider.js';
import { useCachingDossierMiddleware } from '../hooks/useCachingDossierMiddleware.js';

let sqlPromise: Promise<SqlJsStatic> | null = null;
async function getSql() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (_file) => sqlJsWasm,
    });
  }
  return sqlPromise;
}

export function StoryDossierProvider({ children }: { children: ReactNode }) {
  const cachingMiddleware = useCachingDossierMiddleware();
  const [init, setInit] = useState<{ db: Database; client: DossierClient; logger: Logger } | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      const SQL = await getSql();
      const db = new SQL.Database();
      const logger = createConsoleLogger(console);

      const databaseAdapter = (
        await createSqlJsAdapter({ logger }, db, {
          migrate: true,
          fts: { version: 'fts4' },
          journalMode: 'memory',
        })
      ).valueOrThrow();
      const server = (await createServer({ databaseAdapter })).valueOrThrow();

      const processorPlugin = new BackgroundEntityProcessorPlugin(server, logger);
      server.addPlugin(processorPlugin);
      processorPlugin.start();

      const session = (
        await server.createSession({ provider: 'sys', identifier: 'user1' })
      ).valueOrThrow();
      const client = server.createDossierClient(session.context, [
        LoggingClientMiddleware as DossierClientMiddleware<ClientContext>,
        cachingMiddleware,
      ]);

      setInit({ db, client, logger });
    })();
  }, [cachingMiddleware]);

  if (!init) {
    return null;
  }

  return (
    <DossierProvider client={init.client} logger={init.logger}>
      {children}
    </DossierProvider>
  );
}
