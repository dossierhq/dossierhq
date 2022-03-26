import { EntityListScreen } from '@jonasb/datadata-admin-react-components';
import { NavBar } from '../components/NavBar';

export function AdminEntitiesRoute() {
  return (
    <EntityListScreen
      header={<NavBar current="admin-entities" />}
      onCreateEntity={console.log}
      onOpenEntity={console.log}
    />
  );
}
