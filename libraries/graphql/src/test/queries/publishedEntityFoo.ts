import { graphql, type ExecutionResult, type GraphQLSchema } from 'graphql';
import type { SessionGraphQLContext } from '../../GraphQLSchemaGenerator.js';

const gql = String.raw;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Variables = {
  id?: string | null;
  index?: string | null;
  value?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Payload = any;

const QUERY = gql`
  query PublishedFooEntity($id: ID, $index: PublishedUniqueIndex, $value: String) {
    publishedEntity(id: $id, index: $index, value: $value) {
      __typename
      id
      ... on PublishedQueryFoo {
        info {
          name
          authKey
          createdAt
          valid
        }
        fields {
          title
          slug
          summary
          tags
          location
          locations
        }
      }
    }
  }
`;

export function publishedEntityFoo(
  schema: GraphQLSchema,
  contextValue: SessionGraphQLContext,
  variableValues: Variables,
): Promise<ExecutionResult<Payload>> {
  return graphql({ schema, source: QUERY, contextValue, variableValues }) as Promise<
    ExecutionResult<Payload>
  >;
}
