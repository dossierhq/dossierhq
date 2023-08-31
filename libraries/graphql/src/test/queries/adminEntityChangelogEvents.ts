import type { ChangelogEventQuery, EventType } from '@dossierhq/core';
import { graphql, type ExecutionResult, type GraphQLSchema } from 'graphql';
import type { SessionGraphQLContext } from '../../GraphQLSchemaGenerator.js';

const gql = String.raw;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Variables = {
  id: string;
  query?: ChangelogEventQuery | null;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Payload = {
  adminEntity: {
    changelogEvents: {
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
        endCursor: string | null;
      };
      totalCount: number;
      edges: {
        cursor: string;
        node: {
          id: string;
          type: keyof typeof EventType;
          createdBy: string;
          createdAt: string;
          version?: number;
          entities?: {
            id: string;
            version: number;
            type: string;
            name: string;
          }[];
          unauthorizedEntityCount?: number;
        };
      }[];
    };
  };
};

const QUERY = gql`
  query ChangelogEvents($id: ID!, $query: ChangelogEventQueryInput) {
    adminEntity(id: $id) {
      changelogEvents(query: $query) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
        edges {
          cursor
          node {
            id
            type
            createdBy
            createdAt
            ... on EntityChangelogEvent {
              entities {
                id
                version
                type
                name
              }
              unauthorizedEntityCount
            }
          }
        }
      }
    }
  }
`;

export function adminEntityChangelogEvents(
  schema: GraphQLSchema,
  contextValue: SessionGraphQLContext,
  variableValues: Variables,
): Promise<ExecutionResult<Payload>> {
  return graphql({ schema, source: QUERY, contextValue, variableValues }) as Promise<
    ExecutionResult<Payload>
  >;
}
