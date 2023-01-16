// @ts-check
const {
  AdminClientModifyingOperations,
  createConsoleLogger,
  decodeURLSearchParamsParam,
  executeAdminClientOperationFromJson,
  executePublishedClientOperationFromJson,
  LoggingClientMiddleware,
  notOk,
} = require('@dossierhq/core');
const { createServer, NoneAndSubjectAuthorizationAdapter } = require('@dossierhq/server');
const { createDatabase, createSqlite3Adapter } = require('@dossierhq/sqlite3');
const { Database } = require('sqlite3');
const bodyParser = require('body-parser');
const schemaSpecification = require('../src/test/schema.cjs');

const SQLITE_DATABASE_PATH = 'data/arc.sqlite';

let serverResultSingleton = null;

async function getServer() {
  if (!serverResultSingleton) {
    serverResultSingleton = (async () => {
      const logger = createConsoleLogger(console);
      const databaseResult = await createDatabase({ logger }, Database, {
        filename: SQLITE_DATABASE_PATH,
      });
      if (databaseResult.isError()) return databaseResult;

      const adapterResult = await createSqlite3Adapter({ logger }, databaseResult.value, {
        migrate: true,
        fts: { version: 'fts5' },
        journalMode: 'wal',
      });
      if (adapterResult.isError()) return adapterResult;

      const serverResult = await createServer({
        databaseAdapter: adapterResult.value,
        logger,
        authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
      });

      if (serverResult.isOk()) {
        const server = serverResult.value;
        const sessionResult = server.createSession({
          provider: 'sys',
          identifier: 'schemaLoader',
          defaultAuthKeys: ['none'],
        });
        const adminClient = server.createAdminClient(() => sessionResult);
        const schemaResult = await adminClient.updateSchemaSpecification(schemaSpecification);
        if (schemaResult.isError()) return schemaResult;
      }
      return serverResult;
    })();
  }
  return serverResultSingleton;
}

const expressMiddleWare = (router) => {
  router.use(bodyParser.json());
  router.use('/admin', (req, res) => {
    handleClientOperation(req, res, async (server, name, operation) => {
      const defaultAuthKeys = getDefaultAuthKeysFromRequest(req);
      const sessionResult = server.createSession({
        provider: 'sys',
        identifier: 'storybook',
        defaultAuthKeys,
      });
      const adminClient = server.createAdminClient(() => sessionResult, [LoggingClientMiddleware]);
      const modifies = AdminClientModifyingOperations.has(name);
      if (req.method === 'GET' && modifies) {
        return notOk.BadRequest('GET not allowed for modifying operations');
      } else if (req.method === 'PUT' && !modifies) {
        return notOk.BadRequest('PUT only allowed for modifying operations');
      }
      return await executeAdminClientOperationFromJson(adminClient, name, operation);
    });
  });
  router.use('/published', (req, res) => {
    handleClientOperation(req, res, async (server, name, operation) => {
      const defaultAuthKeys = getDefaultAuthKeysFromRequest(req);
      const sessionResult = server.createSession({
        provider: 'sys',
        identifier: 'storybook',
        defaultAuthKeys,
      });
      const adminClient = server.createPublishedClient(
        () => sessionResult,
        [LoggingClientMiddleware]
      );
      return await executePublishedClientOperationFromJson(adminClient, name, operation);
    });
  });
};

function getDefaultAuthKeysFromRequest(req) {
  const defaultKeysValue = req.header('DataData-Default-Auth-Keys');
  const defaultAuthKeys = defaultKeysValue
    ? defaultKeysValue.split(',').map((it) => it.trim())
    : [];
  return defaultAuthKeys;
}

function handleClientOperation(req, res, executeOperation) {
  const { name } = req.query;
  let operation = null;
  if (req.method === 'GET') {
    operation = decodeURLSearchParamsParam(req.query, 'args');
  } else if (req.method === 'PUT') {
    operation = req.body;
  } else {
    res.status(405).send('Only GET and PUT allowed');
    return;
  }
  if (!name) {
    throw new Error('No operation name');
  }
  if (!operation) {
    throw new Error('No operation');
  }

  (async () => {
    const serverResult = await getServer();
    if (serverResult.isError()) {
      res.status(500).send(serverResult.toString()).end();
      return;
    }
    const server = serverResult.value;

    const result = await executeOperation(server, name, operation);
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
