import { SchemaEditorScreen } from '@jonasb/datadata-admin-react-components';
import Head from 'next/head';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { NavBar } from '../NavBar/NavBar';

export default function SchemaEditorPage() {
  return (
    <DataDataSharedProvider>
      <Head>
        <title>Schema</title>
      </Head>
      <SchemaEditorScreen header={<NavBar current="schema" />} />
    </DataDataSharedProvider>
  );
}
