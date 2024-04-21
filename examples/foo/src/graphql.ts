import type { Schema, ErrorType, Result } from '@dossierhq/core';
import { createConsoleLogger, notOk, ok } from '@dossierhq/core';
import { GraphQLSchemaGenerator, type SessionGraphQLContext } from '@dossierhq/graphql';
import type { Server } from '@dossierhq/server';
import express from 'express';
import type { OperationContext, RequestHeaders } from 'graphql-http';
import { createHandler } from 'graphql-http/lib/use/express';
import { initializeServer, updateSchema } from './server.js';

async function createSessionContext(server: Server, headers: RequestHeaders) {
  function getHeader(header: string): Result<string, typeof ErrorType.BadRequest> {
    let value: string | string[] | undefined | null;
    if ('get' in headers && typeof headers.get === 'function') {
      value = headers.get(header);
    } else {
      value = (headers as Record<string, string | string[] | undefined>)[header];
    }
    if (typeof value !== 'string' || !value) {
      return notOk.BadRequest(`Header ${header} is missing`);
    }
    return ok(value);
  }
  const provider = getHeader('insecure-auth-identifier');
  const identifier = getHeader('insecure-auth-identifier');
  if (provider.isError()) return provider;
  if (identifier.isError()) return identifier;

  const sessionResult = await server.createSession({
    provider: provider.value,
    identifier: identifier.value,
  });
  return sessionResult;
}

function startExpressServer(server: Server, schema: Schema, port: number) {
  const gqlSchema = new GraphQLSchemaGenerator({
    schema,
    publishedSchema: schema.toPublishedSchema(),
  }).buildSchema();
  const app = express();
  app.use(
    '/graphql',
    createHandler({
      schema: gqlSchema,
      async context(request): Promise<OperationContext> {
        const context: SessionGraphQLContext = {
          adminClient: notOk.NotAuthenticated('No session'),
          publishedClient: notOk.NotAuthenticated('No session'),
        };
        const sessionResult = await createSessionContext(server, request.headers);
        if (sessionResult.isOk()) {
          context.adminClient = ok(server.createAdminClient(sessionResult.value.context));
          context.publishedClient = ok(server.createPublishedClient(sessionResult.value.context));
        }
        return context as unknown as OperationContext;
      },
    }),
  );
  const expressServer = app.listen(port);
  console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`);
  console.log(
    'Tip: Provide headers in "Request Headers": { "insecure-auth-provider": "test", "insecure-auth-identifier": "john-smith" }',
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
      void server
        .shutdown()
        .then(() => logger.warn('Dossier server closed'))
        .then(() => process.exit(1));
    });
  });
}

await main(4000).catch((error) => {
  console.warn(error);
  process.exitCode = 1;
});
