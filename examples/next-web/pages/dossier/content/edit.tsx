import dynamic from 'next/dynamic';
import type { JSX } from 'react';

const ContentEditorPage = dynamic(
  () => import('../../../components/ContentEditorPage/ContentEditorPage'),
  { ssr: false },
);

export default function ContentEditorPage_(): JSX.Element | null {
  return <ContentEditorPage />;
}
