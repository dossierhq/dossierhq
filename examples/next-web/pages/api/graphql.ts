import { ok } from '@datadata/core';
import type { SessionGraphQLContext } from '@datadata/graphql';
import { GraphQLSchemaGenerator } from '@datadata/graphql';
import { createServerClient } from '@datadata/server';
import { graphql } from 'graphql';
import type { ExecutionResult, GraphQLSchema } from 'graphql';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerConnection, getSessionContextForRequest } from '../../utils/ServerUtils';
import { handlePostWithoutLocation } from '../../utils/HandlerUtils';
import { errorResultToBoom } from '../../utils/ErrorUtils';

let graphQLSchema: GraphQLSchema | null = null;

export default async (
  req: NextApiRequest,
  res: NextApiResponse<ExecutionResult>
): Promise<void> => {
  await handlePostWithoutLocation(req, res, async () => {
    const { authContext, server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, authContext, req);
    if (authResult.isError()) {
      throw errorResultToBoom(authResult);
    }
    const sessionContext = authResult.value;
    const context: SessionGraphQLContext = {
      adminClient: ok(
        createServerClient({ resolveContext: () => Promise.resolve(sessionContext) })
      ),
      context: ok(sessionContext),
    };

    if (!graphQLSchema) {
      graphQLSchema = new GraphQLSchemaGenerator(server.getSchema()).buildSchema();
    }

    const { query, variables, operationName } = req.body;
    const result = await graphql(graphQLSchema, query, null, context, variables, operationName);

    return result;
  });
};
