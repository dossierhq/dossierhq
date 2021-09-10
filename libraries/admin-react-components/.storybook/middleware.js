// @ts-check
const { executeAdminClientOperationFromJson } = require('@jonasb/datadata-core');
const { createServer } = require('@jonasb/datadata-server');
const { createPostgresAdapter } = require('@jonasb/datadata-database-adapter-postgres-pg');
// @ts-ignore
const bodyParser = require('body-parser');
const schemaJson = require('../src/test/schema.json');

let serverResultSingleton = null;

async function getServer() {
  if (!serverResultSingleton) {
    const databaseAdapter = createPostgresAdapter(
      process.env.STORYBOOK_ADMIN_REACT_COMPONENTS_DATABASE_URL
    );

    const result = await createServer({ databaseAdapter });
    serverResultSingleton = result;

    if (result.isOk()) {
      const server = result.value;
      const adminClient = server.createAdminClient(() =>
        server.createSession('sys', 'schemaLoader')
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
    const { name } = req.query;
    let operation = null;
    if (req.method === 'GET') {
      operation = decodeQuery('operation', req.query);
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
      const adminClient = server.createAdminClient(() => server.createSession('sys', 'storybook'));
      const result = await executeAdminClientOperationFromJson(adminClient, name, operation);
      if (result.isError()) {
        res.status(500).send('Error'); //TODO map error type to status
        return;
      }
      res.send(result.value).end();
    })();
  });
};

function decodeQuery(name, query) {
  const encoded = query[name];
  if (encoded === undefined) {
    return undefined;
  }
  if (Array.isArray(encoded)) {
    throw new Error(`Did not expect an array for ${name}`);
  }
  return JSON.parse(decodeURIComponent(encoded));
}

module.exports = expressMiddleWare;
