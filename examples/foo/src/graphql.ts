import 'dotenv/config';
import { notOk, ok, AdminSchema } from '@jonasb/datadata-core';
import { createPostgresAdapter } from '@jonasb/datadata-database-adapter-postgres-pg';
import type { SessionGraphQLContext } from '@jonasb/datadata-graphql';
import { GraphQLSchemaGenerator } from '@jonasb/datadata-graphql';
import { createServer, Server } from '@jonasb/datadata-server';
import type { Handler, NextFunction, Request, Response } from 'express';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import type { IncomingHttpHeaders } from 'http';

type GraphQlMiddleware = ReturnType<typeof graphqlHTTP>;

function middlewareAdapter(middleware: GraphQlMiddleware): Handler {
  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(
      req as unknown as Parameters<GraphQlMiddleware>[0],
      res as unknown as Parameters<GraphQlMiddleware>[1]
    )
      .then(() => next())
      .catch((error) => next(error));
  };
}

async function createSessionContext(server: Server, headers: IncomingHttpHeaders) {
  const provider = headers['insecure-auth-provider'];
  const identifier = headers['insecure-auth-identifier'];
  if (typeof provider !== 'string' || !provider) {
    return notOk.BadRequest('Header insecure-auth-provider is missing');
  }
  if (typeof identifier !== 'string' || !identifier) {
    return notOk.BadRequest('Header insecure-auth-identifier is missing');
  }
  const sessionResult = await server.createSession(provider, identifier);
  return sessionResult;
}

async function startServer(server: Server, schema: AdminSchema, port: number) {
  const gqlSchema = new GraphQLSchemaGenerator(schema).buildSchema();
  const app = express();
  app.use(
    '/graphql',
    middlewareAdapter(
      graphqlHTTP(async (request, _response, _params) => {
        const context: SessionGraphQLContext = {
          schema: notOk.NotAuthenticated('No session'),
          adminClient: notOk.NotAuthenticated('No session'),
          publishedClient: notOk.NotAuthenticated('No session'),
        };
        const sessionResult = await createSessionContext(server, request.headers);
        if (sessionResult.isOk()) {
          context.schema = ok(schema);
          context.adminClient = ok(server.createAdminClient(sessionResult.value.context));
          context.publishedClient = ok(server.createPublishedClient(sessionResult.value.context));
        }
        return {
          schema: gqlSchema,
          context,
          graphiql: {
            headerEditorEnabled: true,
          },
        };
      })
    )
  );
  app.listen(port);
  console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`);
  console.log(
    'Tip: Provide headers in "Request Headers": { "insecure-auth-provider": "test", "insecure-auth-identifier": "john-smith" }'
  );
}

async function main(port: number) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const databaseAdapter = createPostgresAdapter({ connectionString: process.env.DATABASE_URL! });
  const serverResult = await createServer({ databaseAdapter });
  if (serverResult.isError()) throw serverResult.toError();
  const server = serverResult.value;
  try {
    const sessionResult = await server.createSession('sys', 'schemaloader');
    if (sessionResult.isError()) throw sessionResult.toError();
    const schemaResult = await server
      .createAdminClient(sessionResult.value.context)
      .getSchemaSpecification();
    if (schemaResult.isError()) throw schemaResult.toError();
    await startServer(server, new AdminSchema(schemaResult.value), port);
  } finally {
    await server.shutdown();
  }
}

if (require.main === module) {
  main(4000).catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
