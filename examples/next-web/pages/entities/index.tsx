import dynamic from 'next/dynamic';

const EntitiesListPage = dynamic(
  () => import('../../components/EntitiesListPage/EntitiesListPage'),
  { ssr: false }
);

export default function EntitiesIndexPage(): JSX.Element {
  return <EntitiesListPage />;
}
