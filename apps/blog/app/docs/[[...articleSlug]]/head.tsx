import { getPublishedClientForServerComponent } from '../../../utils/ServerComponentUtils';
import { getArticle } from './getArticle';

export default async function Head({ params }: { params: { articleSlug: string } }) {
  const publishedClient = await getPublishedClientForServerComponent();
  const article = await getArticle(publishedClient, params.articleSlug);

  return (
    <>
      <title>{`${article.fields.title} | Dossier`}</title>
    </>
  );
}
