import type { FetcherOpts, FetcherParams } from '@graphiql/toolkit';
import {
  AdminDataDataContext,
  PublishedDataDataContext,
} from '@jonasb/datadata-admin-react-components';
import type { AdminSchema, PublishedSchema } from '@jonasb/datadata-core';
import { ok } from '@jonasb/datadata-core';
import type { SessionGraphQLContext } from '@jonasb/datadata-graphql';
import { GraphQLSchemaGenerator } from '@jonasb/datadata-graphql';
import GraphiQL from 'graphiql';
import 'graphiql/graphiql.min.css';
import { graphql } from 'graphql';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

const DEFAULT_QUERY = `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# Keyboard shortcuts:
#
#   Prettify query:  Shift-Ctrl-P (or press the prettify button)
#
#  Merge fragments:  Shift-Ctrl-M (or press the merge button)
#
#        Run Query:  Ctrl-Enter (or press the play button)
#
#    Auto Complete:  Ctrl-Space (or just start typing)
#

{
  adminSampleEntities(count: 10) {
    totalCount
    items {
      __typename
      id
      info {
        name
      }
    }
  }
}`;

export default function GraphiQLEditor({
  adminSchema,
  publishedSchema,
}: {
  adminSchema: AdminSchema;
  publishedSchema: PublishedSchema;
}) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { publishedClient } = useContext(PublishedDataDataContext);

  const [themeIsSet, setThemeIsSet] = useState(false);

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

  useEffect(() => {
    localStorage.setItem('graphiql:theme', 'light');
    setThemeIsSet(true);
  }, []);

  if (!themeIsSet) return null;

  return <GraphiQL fetcher={fetcher} isHeadersEditorEnabled={false} defaultQuery={DEFAULT_QUERY} />;
}
