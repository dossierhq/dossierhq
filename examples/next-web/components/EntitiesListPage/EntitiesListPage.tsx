import { DataDataContext, EntityListScreen } from '@jonasb/datadata-admin-react-components';
import type { AdminEntity } from '@jonasb/datadata-core';
import { useRouter } from 'next/router';
import { useInitializeContext } from '../../contexts/DataDataContext';
import { urls } from '../../utils/PageUtils';
import { NavBar } from '../NavBar/NavBar';

export default function EntitiesListPage(): JSX.Element | null {
  const router = useRouter();
  const { contextValue } = useInitializeContext();
  const handleCreateEntity = (type: string) => router.push(urls.editPageNew(type));
  const handleEntityOpen = (entity: AdminEntity) => router.push(urls.editPage([entity.id]));

  if (!contextValue) {
    return null;
  }

  return (
    <DataDataContext.Provider value={contextValue}>
      <EntityListScreen
        header={<NavBar current="entities" />}
        onCreateEntity={handleCreateEntity}
        onOpenEntity={handleEntityOpen}
      />
    </DataDataContext.Provider>
  );
}
