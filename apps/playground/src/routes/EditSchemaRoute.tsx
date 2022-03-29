import { SchemaEditorScreen } from '@jonasb/datadata-admin-react-components';
import { NavBar } from '../components/NavBar';

export function EditSchemaRoute() {
  return <SchemaEditorScreen header={<NavBar current="schema" />} />;
}
