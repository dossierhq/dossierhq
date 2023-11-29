import dynamic from 'next/dynamic';

const PublishedContentListPage = dynamic(
  () => import('../../../components/PublishedContentListPage/PublishedContentListPage'),
  { ssr: false },
);

export default function PublishedContentListPage_(): JSX.Element {
  return <PublishedContentListPage />;
}
