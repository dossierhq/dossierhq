import { Schema, ok } from '@dossierhq/core';
import type { SessionGraphQLContext } from '@dossierhq/graphql';
import { GraphQLSchemaGenerator } from '@dossierhq/graphql';
import type { ExecutionResult, GraphQLSchema } from 'graphql';
import { graphql } from 'graphql';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerConnection, getSessionContextForRequest } from '../../utils/ServerUtils';
import { handleRequest, sendMethodNotAllowedError } from '../../utils/HandlerUtils';

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
    const { adminClient, publishedClient } = authResult.value;

    const context: SessionGraphQLContext = {
      adminClient: ok(adminClient),
      publishedClient: ok(publishedClient),
    };

    if (!graphQLSchema) {
      const adminSchemaResult = await adminClient.getSchemaSpecification();
      if (adminSchemaResult.isError()) return adminSchemaResult;
      const adminSchema = new Schema(adminSchemaResult.value);
      graphQLSchema = new GraphQLSchemaGenerator({
        adminSchema,
        publishedSchema: adminSchema.toPublishedSchema(),
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
