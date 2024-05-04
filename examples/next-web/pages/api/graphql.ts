import { ok, Schema } from '@dossierhq/core';
import { GraphQLSchemaGenerator, type SessionGraphQLContext } from '@dossierhq/graphql';
import { graphql, type ExecutionResult, type GraphQLSchema } from 'graphql';
import type { NextApiRequest, NextApiResponse } from 'next';
import { handleRequest, sendMethodNotAllowedError } from '../../utils/HandlerUtils';
import { getServerConnection, getSessionContextForRequest } from '../../utils/ServerUtils';

let graphQLSchema: GraphQLSchema | null = null;

export default async function graphQlHandler(
  req: NextApiRequest,
  res: NextApiResponse<ExecutionResult>,
): Promise<void> {
  if (req.method !== 'POST') {
    sendMethodNotAllowedError(res, ['POST']);
    return;
  }

  await handleRequest(res, async () => {
    const { server } = await getServerConnection();
    const authResult = await getSessionContextForRequest(server, req);
    if (authResult.isError()) return authResult;
    const { client, publishedClient } = authResult.value;

    const context: SessionGraphQLContext = {
      client: ok(client),
      publishedClient: ok(publishedClient),
    };

    if (!graphQLSchema) {
      const adminSchemaResult = await client.getSchemaSpecification();
      if (adminSchemaResult.isError()) return adminSchemaResult;
      const schema = new Schema(adminSchemaResult.value);
      graphQLSchema = new GraphQLSchemaGenerator({
        schema,
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
