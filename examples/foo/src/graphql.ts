#!/usr/bin/env npx ts-node
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { Auth, Instance } from '@datadata/core';
import type { AuthContext } from '@datadata/core';
import { GraphQLSchemaGenerator } from '@datadata/graphql';
import express from 'express';
import { graphqlHTTP } from 'express-graphql';

async function startServer(instance: Instance, authContext: AuthContext, port: number) {
  const schema = new GraphQLSchemaGenerator(instance.getSchema()).buildSchema();
  const app = express();
  app.use(
    '/graphql',
    graphqlHTTP(async (request, response, params) => {
      const sessionResult = await Auth.createSessionForPrincipal(authContext, 'test', 'john-smith');
      if (sessionResult.isError()) {
        throw sessionResult.asError();
      }
      const context = instance.createSessionContext(sessionResult.value);
      return {
        schema,
        context: { context },
        graphiql: true,
      };
    })
  );
  app.listen(port);
  console.log(`Running a GraphQL API server at http://localhost:${port}/graphql`);
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
