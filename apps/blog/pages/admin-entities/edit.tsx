import dynamic from 'next/dynamic';

const AdminEntityEditorPage = dynamic(
  () => import('../../components/AdminEntityEditorPage/AdminEntityEditorPage'),
  { ssr: false }
);

export default function AdminEntityEditor(): JSX.Element | null {
  return <AdminEntityEditorPage />;
}
