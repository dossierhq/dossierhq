import { SchemaEditorScreen } from '@dossierhq/react-components';
import { useState } from 'react';
import { NavBar } from '../components/NavBar.js';
import { ScreenChangesContext } from '../contexts/ScreenChangesContext.js';

export function SchemaEditorRoute() {
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <ScreenChangesContext.Provider
      value={
        hasChanges
          ? 'Changes to the schema will be lost, are you sure you want to leave the page?'
          : null
      }
    >
      <SchemaEditorScreen
        header={<NavBar current="schema" />}
        onEditorHasChangesChange={setHasChanges}
      />
    </ScreenChangesContext.Provider>
  );
}
