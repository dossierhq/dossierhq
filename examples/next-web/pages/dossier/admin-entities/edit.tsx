import dynamic from 'next/dynamic';

const EntityEditorPage = dynamic(
  () => import('../../../components/AdminEntityEditorPage/AdminEntityEditorPage'),
  { ssr: false },
);

export default function NewEntityPage(): JSX.Element | null {
  return <EntityEditorPage />;
}
