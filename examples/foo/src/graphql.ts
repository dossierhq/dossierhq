import type { AdminSchema } from '@dossierhq/core';
import { createConsoleLogger, notOk, ok } from '@dossierhq/core';
import type { SessionGraphQLContext } from '@jonasb/datadata-graphql';
import { GraphQLSchemaGenerator } from '@jonasb/datadata-graphql';
import type { Server } from '@dossierhq/server';
import type { Handler, NextFunction, Request, Response } from 'express';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import type { IncomingHttpHeaders } from 'http';
import { initializeServer, updateSchema } from './server.js';

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
  const sessionResult = await server.createSession({
    provider,
    identifier,
    defaultAuthKeys: ['none'],
  });
  return sessionResult;
}

function startExpressServer(server: Server, schema: AdminSchema, port: number) {
  const gqlSchema = new GraphQLSchemaGenerator({
    adminSchema: schema,
    publishedSchema: schema.toPublishedSchema(),
  }).buildSchema();
  const app = express();
  app.use(
    '/graphql',
    middlewareAdapter(
      graphqlHTTP(async (request, _response, _params) => {
        const context: SessionGraphQLContext = {
          adminClient: notOk.NotAuthenticated('No session'),
          publishedClient: notOk.NotAuthenticated('No session'),
        };
        const sessionResult = await createSessionContext(server, request.headers);
        if (sessionResult.isOk()) {
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
  const expressServer = app.listen(port);
  console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`);
  console.log(
    'Tip: Provide headers in "Request Headers": { "insecure-auth-provider": "test", "insecure-auth-identifier": "john-smith" }'
  );
  return expressServer;
}

async function main(port: number) {
  const logger = createConsoleLogger(console);
  const serverResult = await initializeServer(logger);
  const server = serverResult.valueOrThrow();

  const schema = await updateSchema(server);
  const expressServer = startExpressServer(server, schema, port);

  process.on('SIGINT', () => {
    logger.warn('SIGINT signal received: closing HTTP server');
    expressServer.close(() => {
      logger.warn('HTTP server closed');
      server.shutdown().then(() => logger.warn('datadata server closed'));
      process.exit(1);
    });
  });
}

if (require.main === module) {
  main(4000).catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
