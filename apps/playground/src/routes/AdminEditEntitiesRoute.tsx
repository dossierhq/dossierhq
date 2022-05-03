import { AdminEntityEditorScreen } from '@jonasb/datadata-admin-react-components';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { useWarningOnExit } from '../hooks/useWarningOnExit';

export function AdminEditEntitiesRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasChanges, setHasChanges] = useState(false);

  useWarningOnExit('Changes will be lost, are you sure you want to leave the page?', hasChanges);

  return (
    <AdminEntityEditorScreen
      header={<NavBar current="admin-entities" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
      onEditorHasChangesChange={setHasChanges}
    />
  );
}
