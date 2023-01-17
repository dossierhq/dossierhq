import { AdminDossierContext, PublishedDossierContext } from '@dossierhq/react-components';
import { EmptyStateMessage, FullscreenContainer } from '@dossierhq/design';
import { useContext, lazy, Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary.js';
import { NavBar } from '../components/NavBar.js';

const GraphiQLEditor = lazy(() => import('../components/GraphiQLEditor.js'));

export function GraphiQLRoute(): JSX.Element {
  const { schema: adminSchema } = useContext(AdminDossierContext);
  const { schema: publishedSchema } = useContext(PublishedDossierContext);

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
