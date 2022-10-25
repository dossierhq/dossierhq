import { SchemaEditorScreen } from '@jonasb/datadata-admin-react-components';
import Head from 'next/head';
import { useState } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { useWarningOnExit } from '../../hooks/useWarningOnExit';
import { NavBar } from '../NavBar/NavBar';

export default function SchemaEditorPage() {
  const [hasChanges, setHasChanges] = useState(false);

  useWarningOnExit(
    'Changes to the schema will be lost, are you sure you want to leave the page?',
    hasChanges
  );

  return (
    <DataDataSharedProvider>
      <Head>
        <title>Schema</title>
      </Head>
      <SchemaEditorScreen
        header={<NavBar current="schema" />}
        onEditorHasChangesChange={setHasChanges}
      />
    </DataDataSharedProvider>
  );
}
