import { FullscreenContainer } from '@jonasb/datadata-design';
import React from 'react';
import { useContext, useEffect, useReducer } from 'react';
import type { EntityEditorSelector } from '../..';
import {
  AddEntityDraftAction,
  DataDataContext,
  EntityEditorContainer,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  initializeEntityEditorState,
  reduceEntityEditorState,
  WaitForDataDataContext,
} from '../..';

export interface EntityEditorScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  entitySelectors: EntityEditorSelector[];
  onEntityIdsChanged?: (ids: string[]) => void;
}

export function EntityEditorScreen(props: EntityEditorScreenProps): JSX.Element {
  return (
    <WaitForDataDataContext>
      <EntityEditorScreenInner {...props} />
    </WaitForDataDataContext>
  );
}

function EntityEditorScreenInner({
  header,
  footer,
  entitySelectors,
  onEntityIdsChanged,
}: EntityEditorScreenProps) {
  const { schema } = useContext(DataDataContext);
  const [editorState, dispatchEditorState] = useReducer(
    reduceEntityEditorState,
    { schema, actions: entitySelectors.map((it) => new AddEntityDraftAction(it)) },
    initializeEntityEditorState
  );

  const ids = editorState.drafts.map((it) => it.id);
  useEffect(() => {
    onEntityIdsChanged?.(ids);
  }, [ids, onEntityIdsChanged]);

  return (
    <EntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <EntityEditorStateContext.Provider value={editorState}>
        <FullscreenContainer>
          {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
          <FullscreenContainer.Row fillHeight fullWidth>
            <EntityEditorContainer />
          </FullscreenContainer.Row>
          {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
        </FullscreenContainer>
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}
