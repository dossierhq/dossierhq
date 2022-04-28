import { FullscreenContainer } from '@jonasb/datadata-design';
import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import { AdminTypePicker } from '../../components/AdminTypePicker/AdminTypePicker';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import {
  EntityEditorActions,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { AdminEntityEditorMenu } from './AdminEntityEditorMenu';

export interface AdminEntityEditorScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function AdminEntityEditorScreen({ header, footer }: AdminEntityEditorScreenProps) {
  const { schema } = useContext(AdminDataDataContext);
  const [entityEditorState, dispatchEntityEditorState] = useReducer(
    reduceEntityEditorState,
    undefined,
    initializeEntityEditorState
  );

  const onCreateEntity = useCallback((type: string) => {
    dispatchEntityEditorState(new EntityEditorActions.AddDraft({ newType: type }));
  }, []);

  useEffect(() => {
    if (schema) {
      dispatchEntityEditorState(new EntityEditorActions.UpdateSchemaSpecification(schema));
    }
  }, [schema]);

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Columns fillHeight>
        <FullscreenContainer.ScrollableColumn width="3/12" padding={2} gap={2}>
          <AdminTypePicker iconLeft="add" showEntityTypes onTypeSelected={onCreateEntity}>
            Create
          </AdminTypePicker>
          <AdminEntityEditorMenu
            entityEditorState={entityEditorState}
            dispatchEntityEditorState={dispatchEntityEditorState}
          />
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.ScrollableColumn padding={2} gap={2}>
          CENTER
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.ScrollableColumn width="3/12" padding={2} gap={2}>
          RIGHT
        </FullscreenContainer.ScrollableColumn>
      </FullscreenContainer.Columns>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
