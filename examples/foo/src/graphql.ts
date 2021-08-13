import 'dotenv/config';
import { notOk, ok } from '@jonasb/datadata-core';
import type { SessionGraphQLContext } from '@jonasb/datadata-graphql';
import { GraphQLSchemaGenerator } from '@jonasb/datadata-graphql';
import type { AuthContext } from '@jonasb/datadata-server';
import {
  Auth,
  createServerAdminClient,
  createServerPublishedClient,
  Server,
} from '@jonasb/datadata-server';
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

async function startServer(server: Server, authContext: AuthContext, port: number) {
  const schema = new GraphQLSchemaGenerator(server.getSchema()).buildSchema();
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
        const sessionResult = await createSessionContext(authContext, request.headers);
        if (sessionResult.isOk()) {
          const sessionContext = server.createSessionContext(sessionResult.value);
          context.schema = ok(server.getSchema());
          context.adminClient = ok(createServerAdminClient({ context: sessionContext }));
          context.publishedClient = ok(createServerPublishedClient({ context: sessionContext }));
        }
        return {
          schema,
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
  const server = new Server({ databaseUrl: process.env.DATABASE_URL! });
  const authContext = server.createAuthContext();
  await server.reloadSchema(authContext);
  await startServer(server, authContext, port);
}

if (require.main === module) {
  main(4000).catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
