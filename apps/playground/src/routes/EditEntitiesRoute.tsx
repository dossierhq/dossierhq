import { EntityEditorScreen } from '@jonasb/datadata-admin-react-components';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';
import { useWarningOnExit } from '../hooks/useWarningOnExit.js';

export function EditEntitiesRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSearchParamsChange = useCallback(
    (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
    [setSearchParams]
  );

  useWarningOnExit('Changes will be lost, are you sure you want to leave the page?', hasChanges);

  return (
    <EntityEditorScreen
      header={<NavBar current="admin-entities" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={handleSearchParamsChange}
      onEditorHasChangesChange={setHasChanges}
    />
  );
}
