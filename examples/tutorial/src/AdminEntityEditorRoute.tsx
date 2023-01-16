import { EntityEditorScreen } from '@dossierhq/react-components';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';

export function AdminEntityEditorRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSearchParamsChange = useCallback(
    (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
    [setSearchParams]
  );

  //TODO warn user if they try to leave the page with unsaved changes

  return (
    <EntityEditorScreen
      header={<Navbar current="admin-entities" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={handleSearchParamsChange}
      onEditorHasChangesChange={setHasChanges}
    />
  );
}
