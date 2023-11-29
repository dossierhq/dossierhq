import dynamic from 'next/dynamic';

const ChangelogListPage = dynamic(
  () => import('../../components/ChangelogListPage/ChangelogListPage'),
  {
    ssr: false,
  },
);

export default function ChangelogListPage_(): JSX.Element {
  return <ChangelogListPage />;
}
