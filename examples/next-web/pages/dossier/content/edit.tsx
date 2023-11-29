import dynamic from 'next/dynamic';

const ContentEditorPage = dynamic(
  () => import('../../../components/ContentEditorPage/ContentEditorPage'),
  { ssr: false },
);

export default function ContentEditorPage_(): JSX.Element | null {
  return <ContentEditorPage />;
}
