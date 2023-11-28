import { NotificationContainer } from '@dossierhq/design';
import { SchemaEditorScreen } from '@dossierhq/react-components';
import { useState } from 'react';
import { AppAdminDossierProvider } from './AppAdminDossierProvider.jsx';
import { NavBar } from './NavBar.js';

export function DossierSchemaEditorPage() {
  const [_hasChanges, setHasChanges] = useState(false);
  return (
    <AppAdminDossierProvider>
      <NotificationContainer>
        <SchemaEditorScreen
          header={<NavBar current="schema" />}
          onEditorHasChangesChange={setHasChanges}
        />
      </NotificationContainer>
    </AppAdminDossierProvider>
  );
}
