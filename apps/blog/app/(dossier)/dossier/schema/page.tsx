'use client';

import { SchemaEditorScreen } from '@dossierhq/react-components2';
import { useState } from 'react';
import { AppAdminDossierProvider } from '../../../../contexts/AppAdminDossierProvider';
import { DossierNavBar } from '../DossierNavBar';

export default function Page() {
  const [_hasChanges, setHasChanges] = useState(false);

  return (
    <AppAdminDossierProvider>
      <SchemaEditorScreen
        header={<DossierNavBar current="schema" />}
        onEditorHasChangesChange={setHasChanges}
      />
    </AppAdminDossierProvider>
  );
}
