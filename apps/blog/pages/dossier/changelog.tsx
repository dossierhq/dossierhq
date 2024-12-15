import dynamic from 'next/dynamic';
import type { JSX } from 'react';

const ChangelogListPage = dynamic(
  () => import('../../components/ChangelogListPage/ChangelogListPage'),
  { ssr: false },
);

export default function ChangelogListPage_(): JSX.Element {
  return <ChangelogListPage />;
}
