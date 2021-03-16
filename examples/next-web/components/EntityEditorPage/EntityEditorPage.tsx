import type { EntityEditorSelector } from '@datadata/admin-react-components';
import {
  AddEntityDraftAction,
  DataDataContext,
  EntityEditorContainer,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '@datadata/admin-react-components';
import type { Schema } from '@datadata/core';
import { useEffect, useReducer } from 'react';
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
      {contextValue ? (
        <EntityEditorPageInner schema={contextValue.schema} entitySelector={entitySelector} />
      ) : null}
    </DataDataContext.Provider>
  );
}

function EntityEditorPageInner({
  schema,
  entitySelector,
}: {
  schema: Schema;
  entitySelector: EntityEditorSelector;
}) {
  const [editorState, dispatchEditorState] = useReducer(
    reduceEntityEditorState,
    { schema },
    initializeEntityEditorState
  );

  useEffect(() => {
    dispatchEditorState(new AddEntityDraftAction(entitySelector));
  }, []);

  return <EntityEditorContainer {...{ editorState, dispatchEditorState }} />;
}
