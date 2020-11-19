#!/usr/bin/env npx ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { Auth, Instance, ok, notOk } from '@datadata/core';
import type { AuthContext } from '@datadata/core';
import { GraphQLSchemaGenerator } from '@datadata/graphql';
import type { SessionGraphQLContext } from '@datadata/graphql';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import type { IncomingHttpHeaders } from 'http';

async function createSessionContext(authContext: AuthContext, headers: IncomingHttpHeaders) {
  const provider = headers['insecure-auth-provider'];
  const identifier = headers['insecure-auth-identifier'];
  if (typeof provider !== 'string' || !provider) {
    return notOk.BadRequest('Header insecure-auth-provider is missing');
  }
  if (typeof identifier !== 'string' || !identifier) {
    return notOk.BadRequest('Header insecure-auth-identifier is missing');
  }
  const sessionResult = await Auth.createSessionForPrincipal(authContext, provider, identifier);
  return sessionResult;
}

async function startServer(instance: Instance, authContext: AuthContext, port: number) {
  const schema = new GraphQLSchemaGenerator(instance.getSchema()).buildSchema();
  const app = express();
  app.use(
    '/graphql',
    graphqlHTTP(async (request, response, params) => {
      const context: SessionGraphQLContext = { context: notOk.NotAuthenticated('No session') };
      const sessionResult = await createSessionContext(authContext, request.headers);
      if (sessionResult.isOk()) {
        context.context = ok(instance.createSessionContext(sessionResult.value));
      }
      return {
        schema,
        context,
        graphiql: {
          headerEditorEnabled: true,
        },
      };
    })
  );
  app.listen(port);
  console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`);
  console.log(
    'Tip: Provide headers in "Request Headers": { "insecure-auth-provider": "test", "insecure-auth-identifier": "john-smith" }'
  );
}

async function main(port: number) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const instance = new Instance({ databaseUrl: process.env.DATABASE_URL! });
  const authContext = instance.createAuthContext();
  await instance.reloadSchema(authContext);
  await startServer(instance, authContext, port);
}

if (require.main === module) {
  main(4000).catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
