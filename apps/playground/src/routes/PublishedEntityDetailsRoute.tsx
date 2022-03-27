import { published } from '@jonasb/datadata-admin-react-components';
import { useParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

const { EntityDetailScreen } = published;

export function PublishedEntityDetailsRoute() {
  const { entityId } = useParams();

  return (
    <EntityDetailScreen
      header={<NavBar current="published-entities" />}
      reference={{ id: entityId as string }}
    />
  );
}
