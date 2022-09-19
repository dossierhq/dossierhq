import {
  AdminDataDataContext,
  PublishedDataDataContext,
} from '@jonasb/datadata-admin-react-components';
import { EmptyStateMessage, FullscreenContainer } from '@jonasb/datadata-design';
import { useContext, lazy, Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { NavBar } from '../components/NavBar';

const GraphiQLEditor = lazy(() => import('../components/GraphiQLEditor'));

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
              message="Add an entity type to the schema to enable GraphQL"
            />
          ) : (
            <ErrorBoundary>
              <Suspense fallback={null}>
                <GraphiQLEditor {...{ adminSchema, publishedSchema }} />
              </Suspense>
            </ErrorBoundary>
          )}
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </>
  );
}
