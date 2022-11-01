import type { PublishedClient } from '@jonasb/datadata-core';
import { createConsoleLogger, NoOpLogger } from '@jonasb/datadata-core';
import { createSqlJsAdapter } from '@jonasb/datadata-database-adapter-sqlite-sql.js';
import type { Server } from '@jonasb/datadata-server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@jonasb/datadata-server';
import { readFile } from 'fs/promises';
import crypto from 'node:crypto';
import * as SqlJs from 'sql.js';
import { SYSTEM_USERS } from '../config/SystemUsers';

let serverPromise: Promise<Server> | null = null;
let publishedClientPromise: Promise<PublishedClient> | null = null;

async function getServerCopy() {
  if (!serverPromise) {
    serverPromise = (async () => {
      polyfillCrypto();
      const SQL = await SqlJs.default({ locateFile: (file) => `node_modules/sql.js/dist/${file}` });
      const dbFile = await readFile('./data/database.sqlite');
      const db = new SQL.Database(dbFile);
      const adapter = await createSqlJsAdapter({ logger: NoOpLogger }, db);
      const server = await createServer({
        databaseAdapter: adapter.valueOrThrow(),
        logger,
        authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
      });
      return server.valueOrThrow();
    })();
  }
  return serverPromise;
}

export function getPublishedClientForServerComponent(): Promise<PublishedClient> {
  if (!publishedClientPromise) {
    publishedClientPromise = (async () => {
      const server = await getServerCopy();
      const authResult = await server.createSession(SYSTEM_USERS.serverRenderer);
      return server.createPublishedClient(authResult.valueOrThrow().context);
    })();
  }
  return publishedClientPromise;
}

const logger = createConsoleLogger(console);

function polyfillCrypto() {
  // The sql.js adapter is meant to be run in a browser, polyfill crypto for Node
  if (!globalThis.crypto) {
    globalThis.crypto = crypto;
  }
}
