import dynamic from 'next/dynamic';

const PublishedEntitiesListPage = dynamic(
  () => import('../../../components/PublishedEntitiesListPage/PublishedEntitiesListPage'),
  { ssr: false },
);

export default function PublishedEntitiesIndexPage(): JSX.Element {
  return <PublishedEntitiesListPage />;
}
