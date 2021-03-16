import { DataDataContext, EntitySearch, TypePicker } from '@datadata/admin-react-components';
import type { AdminEntity } from '@datadata/core';
import { useRouter } from 'next/router';
import { useInitializeContext } from '../../contexts/DataDataContext';
import { urls } from '../../utils/PageUtils';

export default function EntitiesListPage(): JSX.Element {
  const router = useRouter();
  const { contextValue } = useInitializeContext();
  const handleCreateEntity = (type: string) => router.push(urls.editPageNew(type));
  const handleEntityClick = (entity: AdminEntity) => router.push(urls.editPage([entity.id]));

  return (
    <DataDataContext.Provider value={contextValue}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          inset: 0,
        }}
      >
        <TypePicker
          id="create-entity"
          text="Create entity"
          showEntityTypes
          onTypeSelected={handleCreateEntity}
        />
        <EntitySearch onEntityClick={handleEntityClick} style={{ width: '100%', height: '100%' }} />
      </div>
    </DataDataContext.Provider>
  );
}
