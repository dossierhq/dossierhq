import { ContentEditorScreen } from '@dossierhq/react-components2';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScreenChangesContext } from '../contexts/ScreenChangesContext.js';

export function ContentEditor2Route() {
  const [searchParams, _setSearchParams] = useSearchParams();
  const [hasChanges, _setHasChanges] = useState(false);

  // const handleSearchParamsChange = useCallback(
  //   (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
  //   [setSearchParams],
  // );

  return (
    <ScreenChangesContext.Provider
      value={hasChanges ? 'Changes will be lost, are you sure you want to leave the page?' : null}
    >
      <ContentEditorScreen
        // header={<NavBar current="content" />}
        urlSearchParams={searchParams}
        // onUrlSearchParamsChange={handleSearchParamsChange}
        // onEditorHasChangesChange={setHasChanges}
      />
    </ScreenChangesContext.Provider>
  );
}