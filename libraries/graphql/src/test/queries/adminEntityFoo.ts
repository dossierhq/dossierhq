import { graphql, type ExecutionResult, type GraphQLSchema } from 'graphql';
import type { SessionGraphQLContext } from '../../GraphQLSchemaGenerator.js';

const gql = String.raw;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Variables = {
  id?: string | null;
  version?: number | null;
  index?: string | null;
  value?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Payload = any;

const QUERY = gql`
  query Entity($id: ID, $version: Int, $index: UniqueIndex, $value: String) {
    entity(id: $id, version: $version, index: $index, value: $value) {
      __typename
      id
      info {
        type
        name
        version
        authKey
        status
        valid
        validPublished
      }
      ... on QueryAdminFoo {
        fields {
          title
          slug
          summary
          tags
          active
          activeList
          bar {
            id
          }
          bars {
            id
          }
          location
          locations
          stringedBar {
            type
          }
        }
      }
    }
  }
`;

export function adminEntityFoo(
  schema: GraphQLSchema,
  contextValue: SessionGraphQLContext,
  variableValues: Variables,
): Promise<ExecutionResult<Payload>> {
  return graphql({ schema, source: QUERY, contextValue, variableValues }) as Promise<
    ExecutionResult<Payload>
  >;
}
