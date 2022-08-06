import { ok, PublishedSchema } from '@jonasb/datadata-core';
import type { SessionGraphQLContext } from '@jonasb/datadata-graphql';
import { GraphQLSchemaGenerator } from '@jonasb/datadata-graphql';
import type { ExecutionResult, GraphQLSchema } from 'graphql';
import { graphql } from 'graphql';
import type { NextApiRequest, NextApiResponse } from 'next';
import { handleRequest, sendMethodNotAllowedError } from '../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../utils/ServerUtils';

let graphQLSchema: GraphQLSchema | null = null;

export default async function graphQlHandler(
  req: NextApiRequest,
  res: NextApiResponse<ExecutionResult>
): Promise<void> {
  if (req.method !== 'POST') {
    sendMethodNotAllowedError(res, ['POST']);
    return;
  }

  await handleRequest(res, async () => {
    const { server, schema } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, req);
    if (authResult.isError()) return authResult;
    const { adminClient, publishedClient } = authResult.value;

    const context: SessionGraphQLContext = {
      adminClient: ok(adminClient),
      publishedClient: ok(publishedClient),
    };

    if (!graphQLSchema) {
      graphQLSchema = new GraphQLSchemaGenerator({
        adminSchema: schema,
        publishedSchema: schema.toPublishedSchema(),
      }).buildSchema();
    }

    const { query, variables, operationName } = req.body;
    const result = await graphql({
      schema: graphQLSchema,
      source: query,
      contextValue: context,
      variableValues: variables,
      operationName,
    });

    return ok(result);
  });
}
