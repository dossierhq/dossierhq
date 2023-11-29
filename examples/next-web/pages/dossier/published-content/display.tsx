import dynamic from 'next/dynamic';

const PublishedContentDisplayPage = dynamic(
  () => import('../../../components/PublishedContentDisplayPage/PublishedContentDisplayPage'),
  { ssr: false },
);

export default function PublishedContentDisplayPage_(): JSX.Element {
  return <PublishedContentDisplayPage />;
}
