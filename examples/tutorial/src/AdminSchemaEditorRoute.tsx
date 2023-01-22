import { SchemaEditorScreen } from '@dossierhq/react-components';
import { useState } from 'react';
import { Navbar } from './Navbar.js';
import { useWarningOnExit } from './useWarningOnExit.js';

export function AdminSchemaEditorRoute() {
  const [hasChanges, setHasChanges] = useState(false);

  useWarningOnExit('Changes will be lost, are you sure you want to leave the page?', hasChanges);

  return (
    <SchemaEditorScreen
      header={<Navbar current="schema" />}
      onEditorHasChangesChange={setHasChanges}
    />
  );
}
