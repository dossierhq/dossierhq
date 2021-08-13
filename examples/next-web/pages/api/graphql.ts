import { ok } from '@jonasb/datadata-core';
import type { SessionGraphQLContext } from '@jonasb/datadata-graphql';
import { GraphQLSchemaGenerator } from '@jonasb/datadata-graphql';
import type { ExecutionResult, GraphQLSchema } from 'graphql';
import { graphql } from 'graphql';
import type { NextApiRequest, NextApiResponse } from 'next';
import { errorResultToBoom } from '../../utils/ErrorUtils';
import { handlePostWithoutLocation } from '../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../utils/ServerUtils';

let graphQLSchema: GraphQLSchema | null = null;

export default async function graphQlHandler(
  req: NextApiRequest,
  res: NextApiResponse<ExecutionResult>
): Promise<void> {
  await handlePostWithoutLocation(req, res, async () => {
    const { authContext, server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, authContext, req);
    if (authResult.isError()) {
      throw errorResultToBoom(authResult);
    }
    const { adminClient, publishedClient } = authResult.value;
    const context: SessionGraphQLContext = {
      schema: ok(server.getSchema()),
      adminClient: ok(adminClient),
      publishedClient: ok(publishedClient),
    };

    if (!graphQLSchema) {
      graphQLSchema = new GraphQLSchemaGenerator(server.getSchema()).buildSchema();
    }

    const { query, variables, operationName } = req.body;
    const result = await graphql(graphQLSchema, query, null, context, variables, operationName);

    return result;
  });
}
