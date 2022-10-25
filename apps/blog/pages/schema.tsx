import dynamic from 'next/dynamic';

const SchemaEditorPage = dynamic(() => import('../components/SchemaEditorPage/SchemaEditorPage'), {
  ssr: false,
});

export default function SchemaEditorPage_(): JSX.Element {
  return <SchemaEditorPage />;
}
