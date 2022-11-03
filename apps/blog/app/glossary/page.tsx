import { FullscreenContainer } from '@jonasb/datadata-design';
import { NavBar } from '../../components/NavBar/NavBar';
import { assertIsPublishedGlossaryTerm } from '../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../utils/ServerComponentUtils';

export default async function Page() {
  const publishedClient = await getPublishedClientForServerComponent();
  const connection = (
    await publishedClient.searchEntities({ entityTypes: ['GlossaryTerm'], order: 'name' })
  ).valueOrThrow();

  return (
    <>
      <FullscreenContainer>
        <FullscreenContainer.Row fullWidth>
          <NavBar current="home" />
        </FullscreenContainer.Row>
        <FullscreenContainer.Row>
          {connection?.edges.map((edge) => {
            const entity = edge.node.valueOrThrow();
            assertIsPublishedGlossaryTerm(entity);
            return <p key={entity.id}>{entity.fields.title}</p>;
          })}
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </>
  );
}
