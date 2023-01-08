import { SchemaEditorScreen } from '@jonasb/datadata-admin-react-components';
import Head from 'next/head';
import { useState } from 'react';
import { AppAdminDataDataProvider } from '../../contexts/AppAdminDataDataProvider';
import { useWarningOnExit } from '../../hooks/useWarningOnExit';
import { NavBar } from '../NavBar/NavBar';

export default function SchemaEditorPage() {
  const [hasChanges, setHasChanges] = useState(false);

  useWarningOnExit(
    'Changes to the schema will be lost, are you sure you want to leave the page?',
    hasChanges
  );

  return (
    <AppAdminDataDataProvider>
      <Head>
        <title>Schema | Blog</title>
      </Head>
      <SchemaEditorScreen
        header={<NavBar current="schema" />}
        onEditorHasChangesChange={setHasChanges}
      />
    </AppAdminDataDataProvider>
  );
}
