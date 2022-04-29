import { AdminEntityEditorScreen } from '@jonasb/datadata-admin-react-components';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

export function AdminEditEntitiesRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <AdminEntityEditorScreen
      header={<NavBar current="admin-entities" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
    />
  );
}
