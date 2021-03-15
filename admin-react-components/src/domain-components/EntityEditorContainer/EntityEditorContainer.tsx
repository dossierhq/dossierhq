import React, { useContext } from 'react';
import { DataDataContext, EntityEditorNew, EntityMetadata, Loader } from '../..';
import type { DataDataContextValue, EntityEditorSelector } from '../..';
import { useEntityEditorState } from '../EntityEditor/EntityEditorReducer';

export interface EntityEditorContainerProps {
  entitySelector: EntityEditorSelector;
}

interface EntityEditorContainerInnerProps extends EntityEditorContainerProps {
  contextValue: DataDataContextValue;
}

export function EntityEditorContainer({ entitySelector }: EntityEditorContainerProps): JSX.Element {
  const contextValue = useContext(DataDataContext);
  if (!contextValue) {
    return <Loader />;
  }

  return <EntityEditorContainerInner {...{ entitySelector, contextValue }} />;
}

function EntityEditorContainerInner({
  entitySelector,
  contextValue,
}: EntityEditorContainerInnerProps): JSX.Element {
  const { editorState, dispatchEditorState } = useEntityEditorState(entitySelector, contextValue);
  return (
    <div style={{ display: 'flex' }}>
      <EntityEditorNew {...{ editorState, dispatchEditorState }} style={{ flexGrow: 1 }} />
      <EntityMetadata entityId={editorState.id} />
    </div>
  );
}
