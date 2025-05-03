import { ok, type PublishedSchema, type Schema } from '@dossierhq/core';
import { GraphQLSchemaGenerator, type SessionGraphQLContext } from '@dossierhq/graphql';
import { DossierContext, PublishedDossierContext } from '@dossierhq/react-components';
import type { FetcherOpts, FetcherParams } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import 'graphiql/style.css';
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
  entitiesSample(count: 10) {
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
  schema,
  publishedSchema,
}: {
  schema: Schema;
  publishedSchema: PublishedSchema;
}) {
  const { client } = useContext(DossierContext);
  const { publishedClient } = useContext(PublishedDossierContext);

  const [themeIsSet, setThemeIsSet] = useState(false);

  const graphQlSchema = useMemo(() => {
    const generator = new GraphQLSchemaGenerator({ schema, publishedSchema });
    const result = generator.buildSchema();

    return result;
  }, [schema, publishedSchema]);

  const graphQlSession = useMemo<SessionGraphQLContext>(() => {
    return {
      client: ok(client),
      publishedClient: ok(publishedClient),
    };
  }, [client, publishedClient]);

  const fetcher = useCallback(
    async (graphQLParams: FetcherParams, _opts?: FetcherOpts) => {
      const result = await graphql({
        schema: graphQlSchema,
        source: graphQLParams.query,
        operationName: graphQLParams.operationName,
        variableValues: graphQLParams.variables as Record<string, unknown>,
        contextValue: graphQlSession,
      });
      return result;
    },
    [graphQlSchema, graphQlSession],
  );

  useEffect(() => {
    localStorage.setItem('graphiql:theme', 'light');
    setThemeIsSet(true);
  }, []);

  if (!themeIsSet) return null;

  return <GraphiQL fetcher={fetcher} isHeadersEditorEnabled={false} defaultQuery={DEFAULT_QUERY} />;
}
