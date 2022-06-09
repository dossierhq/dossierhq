import {
  AdminDataDataContext,
  PublishedDataDataContext,
} from '@jonasb/datadata-admin-react-components';
import type { AdminSchema, PublishedSchema } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { SessionGraphQLContext } from '@jonasb/datadata-graphql';
import { GraphQLSchemaGenerator } from '@jonasb/datadata-graphql';
import type { FetcherOpts, FetcherParams } from 'graphiql';
import GraphiQL from 'graphiql';
import 'graphiql/graphiql.min.css';
import { graphql } from 'graphql';
import { useCallback, useContext, useMemo } from 'react';

export default function GraphiQLEditor({
  adminSchema,
  publishedSchema,
}: {
  adminSchema: AdminSchema;
  publishedSchema: PublishedSchema;
}) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { publishedClient } = useContext(PublishedDataDataContext);

  const graphQlSchema = useMemo(() => {
    const generator = new GraphQLSchemaGenerator({
      adminSchema: adminSchema ?? null,
      publishedSchema: publishedSchema ?? null,
    });
    const result = generator.buildSchema();

    return result;
  }, [adminSchema, publishedSchema]);

  const graphQlSession = useMemo<SessionGraphQLContext>(() => {
    return {
      adminClient: ok(adminClient),
      publishedClient: ok(publishedClient),
    };
  }, [adminClient, publishedClient]);

  const fetcher = useCallback(
    async (graphQLParams: FetcherParams, _opts?: FetcherOpts) => {
      const result = await graphql({
        schema: graphQlSchema,
        source: graphQLParams.query,
        operationName: graphQLParams.operationName,
        variableValues: graphQLParams.variables,
        contextValue: graphQlSession,
      });
      return result;
    },
    [graphQlSchema, graphQlSession]
  );

  return <GraphiQL fetcher={fetcher} headerEditorEnabled={false} />;
}
