import { AdminDossierContext, PublishedDossierContext } from '@dossierhq/react-components';
import { EmptyStateMessage, FullscreenContainer } from '@dossierhq/design';
import { useContext, lazy, Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary.js';
import { NavBar } from '../components/NavBar.js';

const GraphiQLEditor = lazy(() => import('../components/GraphiQLEditor.js'));

export function GraphiQLRoute(): JSX.Element {
  const { schema } = useContext(AdminDossierContext);
  const { schema: publishedSchema } = useContext(PublishedDossierContext);

  let content;
  if (!schema || !publishedSchema) {
    content = null;
  } else if (schema.getEntityTypeCount() === 0) {
    content = (
      <EmptyStateMessage
        icon="add"
        title="No entity types"
        message="Add an entity type to the schema to enable GraphQL"
      />
    );
  } else {
    content = (
      <ErrorBoundary>
        <Suspense fallback={null}>
          <GraphiQLEditor {...{ schema, publishedSchema }} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="graphiql" />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row fullWidth fillHeight>
        {content}
      </FullscreenContainer.Row>
    </FullscreenContainer>
  );
}
