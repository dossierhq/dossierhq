import React, { useContext } from 'react';
import { EntityEditor, EntityMetadata } from '../..';
import { DataDataContext, DataDataContextValue } from '../../contexts/DataDataContext';
import { Loader } from '../../generic-components/Loader/Loader';
import { EntityEditorNew } from '../EntityEditor/EntityEditorNew';
import { EntityEditorSelector, useEntityEditorState } from '../EntityEditor/EntityEditorReducer';

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
