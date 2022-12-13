import { createConsoleLogger, Logger } from '@jonasb/datadata-core';
import { createBetterSqlite3Adapter } from '@jonasb/datadata-database-adapter-better-sqlite3';
import Database from 'better-sqlite3';
import express from 'express';

const app = express();
const port = 3000;

async function initializeDatabase(logger: Logger) {
  const database = new Database('database.sqlite');

  return await createBetterSqlite3Adapter({ logger }, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}

async function initialize() {
  const logger = createConsoleLogger(console);
  const databaseAdapter = (await initializeDatabase(logger)).valueOrThrow();
}

await initialize();

app.get('/api/hello-world', (req, res) => {
  res.send({ message: 'Hello World!' });
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
