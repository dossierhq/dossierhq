import { DataDataContext, EntityList, TypePicker } from '@datadata/admin-react-components';
import type { AdminEntity } from '@datadata/core';
import { useRouter } from 'next/router';
import { useInitializeContext } from '../../contexts/DataDataContext';
import { urls } from '../../utils/PageUtils';

export default function EntitiesListPage(): JSX.Element {
  const router = useRouter();
  const { contextValue } = useInitializeContext();
  const handleCreateEntity = (type: string) => router.push(urls.entitiesPageNew(type));
  const handleEntityClick = (entity: AdminEntity) => router.push(urls.entitiesPage(entity.id));

  return (
    <DataDataContext.Provider value={contextValue}>
      <TypePicker
        id="create-entity"
        text="Create entity"
        showEntityTypes
        onTypeSelected={handleCreateEntity}
      />
      <EntityList onEntityClick={handleEntityClick} />
    </DataDataContext.Provider>
  );
}
