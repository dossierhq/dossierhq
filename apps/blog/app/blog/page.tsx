import { FullscreenContainer } from '@jonasb/datadata-design';
import { NavBar } from '../../components/NavBar/NavBar';
import { getPublishedClientForServerComponent } from '../../utils/ServerComponentUtils';

export default async function Page() {
  const publishedClient = await getPublishedClientForServerComponent();
  const connection = (
    await publishedClient.searchEntities({ entityTypes: ['BlogPost'], order: 'createdAt' })
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
            return <p key={entity.id}>{entity.fields.title as string | null}</p>;
          })}
        </FullscreenContainer.Row>
      </FullscreenContainer>
    </>
  );
}
