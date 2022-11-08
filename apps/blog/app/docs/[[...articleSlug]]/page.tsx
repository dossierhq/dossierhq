import { Text } from '@jonasb/datadata-design';
import { assertIsPublishedArticle } from '../../../utils/SchemaTypes';
import { getPublishedClientForServerComponent } from '../../../utils/ServerComponentUtils';
import { ServerRichTextRenderer } from '../../ServerRichTextRenderer';

export default async function Page({ params }: { params: { articleSlug: string } }) {
  const articleSlug = params.articleSlug ?? 'overview';
  const publishedClient = await getPublishedClientForServerComponent();
  const entity = (
    await publishedClient.getEntity({ index: 'articleSlug', value: articleSlug })
  ).valueOrThrow();
  assertIsPublishedArticle(entity);

  return (
    <>
      <Text as="h4" textStyle="headline4">
        {entity.fields.title}
      </Text>
      <ServerRichTextRenderer richText={entity.fields.body} publishedClient={publishedClient} />
    </>
  );
}
