// @ts-check
const {
  createConsoleLogger,
  decodeUrlQueryStringifiedParam,
  executeAdminClientOperationFromJson,
  executePublishedClientOperationFromJson,
  LoggingClientMiddleware,
} = require('@jonasb/datadata-core');
const { createServer, NoneAndSubjectAuthorizationAdapter } = require('@jonasb/datadata-server');
const { createPostgresAdapter } = require('@jonasb/datadata-database-adapter-postgres-pg');
// @ts-ignore
const bodyParser = require('body-parser');
const schemaJson = require('../src/test/schema.json');

let serverResultSingleton = null;

async function getServer() {
  if (!serverResultSingleton) {
    const databaseAdapter = createPostgresAdapter({
      connectionString: process.env.STORYBOOK_ADMIN_REACT_COMPONENTS_DATABASE_URL,
    });

    const logger = createConsoleLogger(console);
    const result = await createServer({
      databaseAdapter,
      logger,
      authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
    });
    serverResultSingleton = result;

    if (result.isOk()) {
      const server = result.value;
      const adminClient = server.createAdminClient(() =>
        server.createSession({
          provider: 'sys',
          identifier: 'schemaLoader',
          defaultAuthKeys: ['none'],
        })
      );
      const schemaResult = await adminClient.updateSchemaSpecification(schemaJson);
      if (schemaResult.isError()) {
        serverResultSingleton = schemaResult;
      }
    }
  }
  return serverResultSingleton;
}

const expressMiddleWare = (router) => {
  router.use(bodyParser.json());
  router.use('/admin', (req, res) => {
    handleClientOperation(req, res, async (server, name, operation) => {
      const defaultAuthKeys = getDefaultAuthKeysFromRequest(req);
      const adminClient = server.createAdminClient(
        () =>
          server.createSession({
            provider: 'sys',
            identifier: 'storybook',
            defaultAuthKeys,
          }),
        [LoggingClientMiddleware]
      );
      //TODO ensure only !modifies operations are executed for GET
      return await executeAdminClientOperationFromJson(adminClient, name, operation);
    });
  });
  router.use('/published', (req, res) => {
    handleClientOperation(req, res, async (server, name, operation) => {
      const defaultAuthKeys = getDefaultAuthKeysFromRequest(req);
      const adminClient = server.createPublishedClient(
        () =>
          server.createSession({
            provider: 'sys',
            identifier: 'storybook',
            defaultAuthKeys,
          }),
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
    operation = decodeUrlQueryStringifiedParam('operation', req.query);
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
