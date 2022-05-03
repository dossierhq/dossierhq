import { SchemaEditorScreen } from '@jonasb/datadata-admin-react-components';
import { useState } from 'react';
import { NavBar } from '../components/NavBar';
import { useWarningOnExit } from '../hooks/useWarningOnExit';

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
