import dynamic from 'next/dynamic';

const PublishedEntityDisplayPage = dynamic(
  () => import('../../../components/PublishedEntityDisplayPage/PublishedEntityDisplayPage'),
  { ssr: false },
);

export default function PublishedEntitiesDetailPage_(): JSX.Element {
  return <PublishedEntityDisplayPage />;
}
