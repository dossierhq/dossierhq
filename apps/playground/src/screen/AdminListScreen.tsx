import { EntityListScreen } from '@jonasb/datadata-admin-react-components';

export function AdminListScreen() {
  return <EntityListScreen onCreateEntity={console.log} onOpenEntity={console.log} />;
}
