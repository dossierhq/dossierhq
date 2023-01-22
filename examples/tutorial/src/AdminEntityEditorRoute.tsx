import { EntityEditorScreen } from '@dossierhq/react-components';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { useWarningOnExit } from './useWarningOnExit.js';

export function AdminEntityEditorRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSearchParamsChange = useCallback(
    (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
    [setSearchParams]
  );

  useWarningOnExit('Changes will be lost, are you sure you want to leave the page?', hasChanges);

  return (
    <EntityEditorScreen
      header={<Navbar current="admin-entities" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={handleSearchParamsChange}
      onEditorHasChangesChange={setHasChanges}
    />
  );
}
