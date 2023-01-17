import { SchemaEditorScreen } from '@dossierhq/react-components';
import Head from 'next/head';
import { useState } from 'react';
import { AppAdminDossierProvider } from '../../contexts/AppAdminDossierProvider';
import { useWarningOnExit } from '../../hooks/useWarningOnExit';
import { NavBar } from '../NavBar/NavBar';

export default function SchemaEditorPage() {
  const [hasChanges, setHasChanges] = useState(false);

  useWarningOnExit(
    'Changes to the schema will be lost, are you sure you want to leave the page?',
    hasChanges
  );

  return (
    <AppAdminDossierProvider>
      <Head>
        <title>Schema | Blog</title>
      </Head>
      <SchemaEditorScreen
        header={<NavBar current="schema" />}
        onEditorHasChangesChange={setHasChanges}
      />
    </AppAdminDossierProvider>
  );
}
