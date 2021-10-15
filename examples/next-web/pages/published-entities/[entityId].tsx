import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

const PublishedEntitiesDetailPage = dynamic(
  () => import('../../components/PublishedEntityDetailPage/PublishedEntityDetailPage'),
  { ssr: false }
);

export default function PublishedEntitiesDetailPage_(): JSX.Element {
  const router = useRouter();
  const { entityId } = router.query;

  return <PublishedEntitiesDetailPage reference={{ id: entityId as string }} />;
}
