import { ContentEditorScreen } from '@dossierhq/react-components';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';
import { ScreenChangesContext } from '../contexts/ScreenChangesContext.js';

export function ContentEditorRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSearchParamsChange = useCallback(
    (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
    [setSearchParams]
  );

  return (
    <ScreenChangesContext.Provider
      value={hasChanges ? 'Changes will be lost, are you sure you want to leave the page?' : null}
    >
      <ContentEditorScreen
        header={<NavBar current="content" />}
        urlSearchParams={searchParams}
        onUrlSearchParamsChange={handleSearchParamsChange}
        onEditorHasChangesChange={setHasChanges}
      />
    </ScreenChangesContext.Provider>
  );
}
