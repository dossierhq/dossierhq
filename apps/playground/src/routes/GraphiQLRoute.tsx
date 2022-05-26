import {
  AdminDataDataContext,
  PublishedDataDataContext,
} from '@jonasb/datadata-admin-react-components';
import { AdminSchema, ok, PublishedSchema } from '@jonasb/datadata-core';
import { EmptyStateMessage, FullscreenContainer } from '@jonasb/datadata-design';
import { GraphQLSchemaGenerator, SessionGraphQLContext } from '@jonasb/datadata-graphql';
import GraphiQL, { FetcherOpts, FetcherParams } from 'graphiql';
import 'graphiql/graphiql.min.css';
import { graphql } from 'graphql';
import { useCallback, useContext, useMemo } from 'react';
import { NavBar } from '../components/NavBar';

export function GraphiQLRoute(): JSX.Element {
  const { schema: adminSchema } = useContext(AdminDataDataContext);
  const { schema: publishedSchema } = useContext(PublishedDataDataContext);

  return (
    <>
      <FullscreenContainer>
        <FullscreenContainer.Row fullWidth>
          <NavBar current="graphiql" />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row fullWidth fillHeight>
          {!adminSchema || !publishedSchema ? null : adminSchema.getEntityTypeCount() === 0 ? (
            <EmptyStateMessage
              icon="add"
              title="No entity types"
              message="Create an entity type to enable Graphql"
            />
          ) : (
            <Editor {...{ adminSchema, publishedSchema }} />
          )}
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </>
  );
}

function Editor({
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
