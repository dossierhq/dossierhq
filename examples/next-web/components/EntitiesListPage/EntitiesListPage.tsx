import {
  Column,
  DataDataContext,
  EntitySearch,
  Loader,
  TypePicker,
} from '@jonasb/datadata-admin-react-components';
import type { AdminEntity } from '@jonasb/datadata-core';
import { useRouter } from 'next/router';
import { useInitializeContext } from '../../contexts/DataDataContext';
import { urls } from '../../utils/PageUtils';

export default function EntitiesListPage(): JSX.Element {
  const router = useRouter();
  const { contextValue } = useInitializeContext();
  const handleCreateEntity = (type: string) => router.push(urls.editPageNew(type));
  const handleEntityClick = (entity: AdminEntity) => router.push(urls.editPage([entity.id]));

  if (!contextValue) {
    return <Loader />;
  }

  return (
    <DataDataContext.Provider value={contextValue}>
      <Column className="position-fixed inset-0">
        <TypePicker
          id="create-entity"
          text="Create entity"
          showEntityTypes
          onTypeSelected={handleCreateEntity}
        />
        <EntitySearch className="flex-grow h-0" onEntityClick={handleEntityClick} />
      </Column>
    </DataDataContext.Provider>
  );
}
