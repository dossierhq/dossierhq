import { SchemaEditorScreen, ThemeProvider } from '@dossierhq/react-components2';
import { useState } from 'react';
import { ScreenChangesContext } from '../contexts/ScreenChangesContext.js';

export function SchemaEditorRoute() {
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <ThemeProvider>
      <ScreenChangesContext.Provider
        value={hasChanges ? 'Changes will be lost, are you sure you want to leave the page?' : null}
      >
        <SchemaEditorScreen onEditorHasChangesChange={setHasChanges} />
      </ScreenChangesContext.Provider>
    </ThemeProvider>
  );
}
