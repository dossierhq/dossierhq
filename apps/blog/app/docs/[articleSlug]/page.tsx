import { FullscreenContainer, Text } from '@jonasb/datadata-design';
import { NavBar } from '../../../components/NavBar/NavBar';
import { assertIsPublishedArticle } from '../../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../../utils/ServerComponentUtils';
import { ServerRichTextRenderer } from '../../ServerRichTextRenderer';

export default async function Page({ params }: { params: { articleSlug: string } }) {
  const publishedClient = await getPublishedClientForServerComponent();
  const entity = (
    await publishedClient.getEntity({ index: 'articleSlug', value: params.articleSlug })
  ).valueOrThrow();
  assertIsPublishedArticle(entity);

  return (
    <>
      <FullscreenContainer>
        <FullscreenContainer.Row fullWidth>
          <NavBar current="home" />
        </FullscreenContainer.Row>
        <FullscreenContainer.ScrollableRow>
          <FullscreenContainer.Row>
            <Text as="h4" textStyle="headline4">
              {entity.fields.title}
            </Text>
            <ServerRichTextRenderer
              richText={entity.fields.body}
              publishedClient={publishedClient}
            />
          </FullscreenContainer.Row>
        </FullscreenContainer.ScrollableRow>
      </FullscreenContainer>
    </>
  );
}
