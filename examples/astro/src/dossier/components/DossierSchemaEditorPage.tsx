import { SchemaEditorScreen, ThemeProvider } from '@dossierhq/react-components2';
import { useState } from 'react';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.js';
import { NavBar } from './NavBar.js';

export function DossierSchemaEditorPage() {
  const [_hasChanges, setHasChanges] = useState(false);
  return (
    <ThemeProvider>
      <AppAdminDossierProvider>
        <SchemaEditorScreen
          header={<NavBar current="schema" />}
          onEditorHasChangesChange={setHasChanges}
        />
      </AppAdminDossierProvider>
    </ThemeProvider>
  );
}
