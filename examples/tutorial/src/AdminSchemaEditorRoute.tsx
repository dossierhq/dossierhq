import { SchemaEditorScreen } from '@dossierhq/react-components';
import { useState } from 'react';
import { Navbar } from './Navbar.js';

export function AdminSchemaEditorRoute() {
  const [hasChanges, setHasChanges] = useState(false);

  //TODO warn user if they try to leave the page with unsaved changes

  return (
    <SchemaEditorScreen
      header={<Navbar current="schema" />}
      onEditorHasChangesChange={setHasChanges}
    />
  );
}
