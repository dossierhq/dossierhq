import dynamic from 'next/dynamic';

const AdminEntitiesListPage = dynamic(
  () => import('../../../components/AdminEntitiesListPage/AdminEntitiesListPage'),
  { ssr: false }
);

export default function AdminEntitiesIndexPage(): JSX.Element {
  return <AdminEntitiesListPage />;
}
