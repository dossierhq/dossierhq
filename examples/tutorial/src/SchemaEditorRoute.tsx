import { SchemaEditorScreen } from '@dossierhq/react-components';
import { useState } from 'react';
import { Navbar } from './Navbar.js';
import { ScreenChangesContext } from './ScreenChangesContext.js';

export function SchemaEditorRoute() {
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <ScreenChangesContext.Provider
      value={
        hasChanges
          ? 'Changes to schema will be lost, are you sure you want to leave the page?'
          : null
      }
    >
      <SchemaEditorScreen
        header={<Navbar current="schema" />}
        onEditorHasChangesChange={setHasChanges}
      />
    </ScreenChangesContext.Provider>
  );
}
