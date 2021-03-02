import { DataDataContext, EntityEditorContainer } from '@datadata/admin-react-components';
import type { EntityEditorProps } from '@datadata/admin-react-components';
import { useInitializeContext } from '../../contexts/DataDataContext';

export interface EntityEditorPageProps {
  entityId: 'new' | string;
  entityType?: string;
}

export function EntityEditorPage({ entityId, entityType }: EntityEditorPageProps): JSX.Element {
  const { contextValue } = useInitializeContext();
  const entity: EntityEditorProps['entity'] =
    entityId === 'new' && entityType ? { type: entityType, isNew: true } : { id: entityId };

  return (
    <DataDataContext.Provider value={contextValue}>
      <EntityEditorContainer entity={entity} />
    </DataDataContext.Provider>
  );
}
