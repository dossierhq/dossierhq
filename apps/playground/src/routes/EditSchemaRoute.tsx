import { SchemaEditorScreen } from '@dossierhq/react-components';
import { useState } from 'react';
import { NavBar } from '../components/NavBar.js';
import { useWarningOnExit } from '../hooks/useWarningOnExit.js';

export function EditSchemaRoute() {
  const [hasChanges, setHasChanges] = useState(false);

  useWarningOnExit(
    'Changes to the schema will be lost, are you sure you want to leave the page?',
    hasChanges
  );

  return (
    <SchemaEditorScreen
      header={<NavBar current="schema" />}
      onEditorHasChangesChange={setHasChanges}
    />
  );
}
