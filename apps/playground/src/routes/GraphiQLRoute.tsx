import {
  AdminDataDataContext,
  PublishedDataDataContext,
} from '@jonasb/datadata-admin-react-components';
import { EmptyStateMessage, FullscreenContainer } from '@jonasb/datadata-design';
import 'graphiql/graphiql.min.css';
import { useContext } from 'react';
import { GraphiQLEditor } from '../components/GraphiQLEditor';
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
            <GraphiQLEditor {...{ adminSchema, publishedSchema }} />
          )}
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </>
  );
}
