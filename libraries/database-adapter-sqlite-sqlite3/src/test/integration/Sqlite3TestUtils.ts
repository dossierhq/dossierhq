import {
  createTestAuthorizationAdapter,
  IntegrationTestSchemaSpecifciationUpdate,
} from '@jonasb/datadata-database-adapter-test-integration';
import { createServer } from '@jonasb/datadata-server';
import { createSqlite3TestAdapter } from '../../TestUtils';

export async function initializeSqlite3Server(filename: string | ':memory:', mode?: number) {
  const databaseAdapterResult = await createSqlite3TestAdapter(filename, mode);
  if (databaseAdapterResult.isError()) {
    return databaseAdapterResult;
  }

  const createServerResult = await createServer({
    databaseAdapter: databaseAdapterResult.value,
    authorizationAdapter: createTestAuthorizationAdapter(),
  });
  if (createServerResult.isError()) {
    return createServerResult;
  }
  const server = createServerResult.value;

  const client = server.createAdminClient(() =>
    server.createSession({
      provider: 'test',
      identifier: 'schema-loader',
      defaultAuthKeys: [],
    })
  );
  const schemaResult = await client.updateSchemaSpecification(
    IntegrationTestSchemaSpecifciationUpdate
  );
  if (schemaResult.isError()) {
    return schemaResult;
  }

  return createServerResult;
}
