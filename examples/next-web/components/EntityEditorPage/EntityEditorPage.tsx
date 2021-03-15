import { DataDataContext, EntityEditorContainer } from '@datadata/admin-react-components';
import { useInitializeContext } from '../../contexts/DataDataContext';

export interface EntityEditorPageProps {
  entityId: 'new' | string;
  entityType?: string;
}

export function EntityEditorPage({ entityId, entityType }: EntityEditorPageProps): JSX.Element {
  const { contextValue } = useInitializeContext();
  const entitySelector =
    entityId === 'new' && entityType ? { newType: entityType } : { id: entityId };

  return (
    <DataDataContext.Provider value={contextValue}>
      <EntityEditorContainer entitySelector={entitySelector} />
    </DataDataContext.Provider>
  );
}
