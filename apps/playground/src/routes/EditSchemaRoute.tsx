import { published, SchemaEditorScreen } from '@jonasb/datadata-admin-react-components';
import { useParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

export function EditSchemaRoute() {
  return <SchemaEditorScreen header={<NavBar current="schema" />} />;
}
