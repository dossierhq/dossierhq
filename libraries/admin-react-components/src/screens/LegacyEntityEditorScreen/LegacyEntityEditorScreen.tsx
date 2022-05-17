import { FullscreenContainer } from '@jonasb/datadata-design';
import React, { useContext, useEffect, useReducer } from 'react';
import { WaitForLegacyDataDataContext } from '../../components/AdminDataDataProvider/AdminDataDataProvider';
import { LegacyDataDataContext } from '../../contexts/LegacyDataDataContext';
import {
  LegacyEntityEditorDispatchContext,
  LegacyEntityEditorStateContext,
} from '../../contexts/LegacyEntityEditorState';
import type { LegacyEntityEditorSelector } from '../../domain-components/LegacyEntityEditor/LegacyEntityEditorReducer';
import {
  initializeLegacyEntityEditorState,
  LegacyAddEntityDraftAction,
  reduceLegacyEntityEditorState,
} from '../../domain-components/LegacyEntityEditor/LegacyEntityEditorReducer';
import { LegacyEntityEditorContainer } from '../../domain-components/LegacyEntityEditorContainer/LegacyEntityEditorContainer';

export interface EntityEditorScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  entitySelectors: LegacyEntityEditorSelector[];
  onEntityIdsChanged?: (ids: string[]) => void;
}

export function LegacyEntityEditorScreen(props: EntityEditorScreenProps): JSX.Element {
  return (
    <WaitForLegacyDataDataContext>
      <EntityEditorScreenInner {...props} />
    </WaitForLegacyDataDataContext>
  );
}

function EntityEditorScreenInner({
  header,
  footer,
  entitySelectors,
  onEntityIdsChanged,
}: EntityEditorScreenProps) {
  const { schema } = useContext(LegacyDataDataContext);
  const [editorState, dispatchEditorState] = useReducer(
    reduceLegacyEntityEditorState,
    { schema, actions: entitySelectors.map((it) => new LegacyAddEntityDraftAction(it)) },
    initializeLegacyEntityEditorState
  );

  const ids = editorState.drafts.map((it) => it.id);
  useEffect(() => {
    onEntityIdsChanged?.(ids);
  }, [ids, onEntityIdsChanged]);

  return (
    <LegacyEntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <LegacyEntityEditorStateContext.Provider value={editorState}>
        <FullscreenContainer>
          {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
          <FullscreenContainer.Row fillHeight fullWidth>
            <LegacyEntityEditorContainer />
          </FullscreenContainer.Row>
          {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
        </FullscreenContainer>
      </LegacyEntityEditorStateContext.Provider>
    </LegacyEntityEditorDispatchContext.Provider>
  );
}
