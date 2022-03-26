import { EntityListScreen } from '@jonasb/datadata-admin-react-components';

export function AdminEntitiesRoute() {
  return <EntityListScreen onCreateEntity={console.log} onOpenEntity={console.log} />;
}
