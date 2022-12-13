import { createConsoleLogger, Logger, notOk, ok } from '@jonasb/datadata-core';
import { createBetterSqlite3Adapter } from '@jonasb/datadata-database-adapter-better-sqlite3';
import BetterSqlite, { type Database } from 'better-sqlite3';
import express from 'express';

const app = express();
const port = 3000;

async function initializeDatabase(logger: Logger) {
  const context = { logger };
  let database: Database;
  try {
    database = new BetterSqlite('database.sqlite');
  } catch (error) {
    return notOk.GenericUnexpectedException(context, error);
  }

  return await createBetterSqlite3Adapter(context, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}

async function initialize() {
  const logger = createConsoleLogger(console);

  const databaseResult = await initializeDatabase(logger);
  if (databaseResult.isError()) return databaseResult;

  return ok(undefined);
}

(await initialize()).throwIfError();

app.get('/api/hello-world', (req, res) => {
  res.send({ message: 'Hello World!' });
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
