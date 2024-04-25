// @ts-check
const {
  DossierClientModifyingOperations,
  createConsoleLogger,
  decodeURLSearchParamsParam,
  executeJsonDossierClientOperation,
  executeJsonPublishedDossierClientOperation,
  LoggingClientMiddleware,
  notOk,
} = require('@dossierhq/core');
const { createServer, SubjectAuthorizationAdapter } = require('@dossierhq/server');
const { createBetterSqlite3Adapter } = require('@dossierhq/better-sqlite3');
const Database = require('better-sqlite3');
const bodyParser = require('body-parser');
const { copyFileSync } = require('node:fs');

const SOURCE_DATABASE_PATH = './node_modules/playground-example-generator/dist/catalog.sqlite';
const SQLITE_DATABASE_PATH = 'data/catalog.sqlite';

const logger = createConsoleLogger(console);
let serverResultSingleton = null;

async function getServer() {
  if (!serverResultSingleton) {
    serverResultSingleton = (async () => {
      console.log(
        `Resetting database by copying ${SOURCE_DATABASE_PATH} to ${SQLITE_DATABASE_PATH}`,
      );
      copyFileSync(SOURCE_DATABASE_PATH, SQLITE_DATABASE_PATH);
      const database = new Database(SQLITE_DATABASE_PATH);

      const adapterResult = await createBetterSqlite3Adapter({ logger }, database, {
        migrate: true,
        fts: { version: 'fts4' },
        journalMode: 'wal',
      });
      if (adapterResult.isError()) return adapterResult;

      const serverResult = await createServer({
        databaseAdapter: adapterResult.value,
        logger,
        authorizationAdapter: SubjectAuthorizationAdapter,
      });

      return serverResult;
    })();
  }
  return serverResultSingleton;
}

const expressMiddleWare = (router) => {
  router.use(bodyParser.json());
  router.use('/api/admin/:operationName', (req, res) => {
    handleClientOperation(req, res, async (server, name, operation) => {
      const defaultAuthKeys = getDefaultAuthKeysFromRequest(req);
      const sessionResult = server.createSession({
        provider: 'sys',
        identifier: 'storybook',
        defaultAuthKeys,
      });
      const client = server.createDossierClient(() => sessionResult, [LoggingClientMiddleware]);
      const modifies = DossierClientModifyingOperations.has(name);
      if (req.method === 'GET' && modifies) {
        return notOk.BadRequest('GET not allowed for modifying operations');
      } else if (req.method === 'PUT' && !modifies) {
        return notOk.BadRequest('PUT only allowed for modifying operations');
      }
      return await executeJsonDossierClientOperation(client, name, operation);
    });
  });
  router.use('/api/published/:operationName', (req, res) => {
    handleClientOperation(req, res, async (server, name, operation) => {
      const defaultAuthKeys = getDefaultAuthKeysFromRequest(req);
      const sessionResult = server.createSession({
        provider: 'sys',
        identifier: 'storybook',
        defaultAuthKeys,
      });
      const client = server.createPublishedClient(() => sessionResult, [LoggingClientMiddleware]);
      return await executeJsonPublishedDossierClientOperation(client, name, operation);
    });
  });
};

function getDefaultAuthKeysFromRequest(req) {
  const defaultKeysValue = req.header('Dossier-Default-Auth-Keys');
  const defaultAuthKeys = defaultKeysValue
    ? defaultKeysValue.split(',').map((it) => it.trim())
    : [];
  return defaultAuthKeys;
}

function handleClientOperation(req, res, executeOperation) {
  const { operationName } = req.params;
  let operation = null;
  if (req.method === 'GET') {
    operation = decodeURLSearchParamsParam(req.query, 'args');
  } else if (req.method === 'PUT') {
    operation = req.body;
  } else {
    res.status(405).send('Only GET and PUT allowed');
    return;
  }
  if (!operationName) {
    throw new Error('No operation name');
  }
  if (!operation) {
    throw new Error('No operation');
  }

  (async () => {
    const serverResult = await getServer();
    if (serverResult.isError()) {
      logger.error('Failed initializing server: %s: %s', serverResult.error, serverResult.message);
      res.status(500).send(`${serverResult.error}: ${serverResult.message}`).end();
      return;
    }
    const server = serverResult.value;

    const result = await executeOperation(server, operationName, operation);
    if (result.isError()) {
      res.status(result.httpStatus).send(result.message);
      return;
    }
    // Express built-in json conversion doesn't handle null (sends empty response)
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify(result.value, null, 2)).end();
  })();
}

module.exports = expressMiddleWare;
