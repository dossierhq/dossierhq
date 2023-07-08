import dynamic from 'next/dynamic';

const EntitiesListPage = dynamic(
  () => import('../../../components/AdminEntitiesListPage/AdminEntitiesListPage'),
  { ssr: false },
);

export default function EntitiesIndexPage(): JSX.Element {
  return <EntitiesListPage />;
}
