import { BeforeUnload, FullscreenContainer, Level, Text } from '@jonasb/datadata-design';
import type { Dispatch, MouseEvent } from 'react';
import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import { AdminTypePicker } from '../../components/AdminTypePicker/AdminTypePicker';
import { EntityEditor } from '../../components/EntityEditor/EntityEditor';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { useAdminEntity } from '../../hooks/useAdminEntity';
import type {
  EntityEditorDraftState,
  EntityEditorStateAction,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import {
  EntityEditorActions,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { useSynchronizeUrlQueryAndEntityEditorState } from '../../reducers/EntityEditorReducer/EntityEditorUrlSynchronizer';
import { AdminEntityEditorMenu } from './AdminEntityEditorMenu';

export interface AdminEntityEditorScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlSearchParams?: Readonly<URLSearchParams>;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
}

export function AdminEntityEditorScreen({
  header,
  footer,
  urlSearchParams,
  onUrlSearchParamsChange,
}: AdminEntityEditorScreenProps) {
  const { schema } = useContext(AdminDataDataContext);
  const [entityEditorState, dispatchEntityEditorState] = useReducer(
    reduceEntityEditorState,
    undefined,
    initializeEntityEditorState
  );
  const { drafts, activeEntityId, activeEntityMenuScrollSignal, activeEntityEditorScrollSignal } =
    entityEditorState;

  const onCreateEntity = useCallback((type: string) => {
    dispatchEntityEditorState(new EntityEditorActions.AddDraft({ newType: type }));
  }, []);

  useEffect(() => {
    if (schema) {
      dispatchEntityEditorState(new EntityEditorActions.UpdateSchemaSpecification(schema));
    }
  }, [schema]);

  useSynchronizeUrlQueryAndEntityEditorState(
    urlSearchParams,
    onUrlSearchParamsChange,
    entityEditorState,
    dispatchEntityEditorState
  );

  const menuScrollToId = activeEntityId ? `${activeEntityId}-menuItem` : undefined;
  const editorScrollToId = activeEntityId ? `${activeEntityId}-header` : undefined;

  return (
    <FullscreenContainer>
      {entityEditorState.status !== '' ? (
        <BeforeUnload message="By leaving the page you will lose changes" />
      ) : null}
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Columns fillHeight>
        <FullscreenContainer.ScrollableColumn
          width="3/12"
          padding={2}
          gap={2}
          scrollToId={menuScrollToId}
          scrollToIdSignal={activeEntityMenuScrollSignal}
        >
          <AdminTypePicker iconLeft="add" showEntityTypes onTypeSelected={onCreateEntity}>
            Create
          </AdminTypePicker>
          <AdminEntityEditorMenu
            entityEditorState={entityEditorState}
            dispatchEntityEditorState={dispatchEntityEditorState}
          />
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.ScrollableColumn
          scrollToId={editorScrollToId}
          scrollToIdSignal={activeEntityEditorScrollSignal}
        >
          {drafts.map((draftState) => (
            <EntityRows
              key={draftState.id}
              draftState={draftState}
              dispatchEntityEditorState={dispatchEntityEditorState}
            />
          ))}
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.ScrollableColumn width="3/12" padding={2} gap={2}>
          RIGHT
        </FullscreenContainer.ScrollableColumn>
      </FullscreenContainer.Columns>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}

function EntityRows({
  draftState,
  dispatchEntityEditorState,
}: {
  draftState: EntityEditorDraftState;
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>;
}) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { entity, entityError: _unused } = useAdminEntity(adminClient, { id: draftState.id });

  useEffect(() => {
    if (entity) {
      dispatchEntityEditorState(new EntityEditorActions.UpdateEntity(entity));
    }
  }, [dispatchEntityEditorState, entity]);

  const handleClick = useCallback(
    (_event: MouseEvent) =>
      dispatchEntityEditorState(
        new EntityEditorActions.SetActiveEntity(draftState.id, true, false)
      ),
    [dispatchEntityEditorState, draftState.id]
  );

  if (!draftState.draft) {
    return null;
  }

  return (
    <>
      <FullscreenContainer.Row id={`${draftState.id}-header`} sticky>
        <Level paddingHorizontal={3}>
          <Level.Left>
            <Level.Item textStyle="headline4">
              {draftState.draft.name || 'Untitled'}{' '}
              <Text as="span" textStyle="headline6">
                {draftState.draft.entitySpec.name}
              </Text>
            </Level.Item>
          </Level.Left>
          <Level.Right>
            <Level.Item textStyle="headline6">{draftState.status}</Level.Item>
          </Level.Right>
        </Level>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row
        gap={2}
        paddingVertical={4}
        paddingHorizontal={3}
        marginBottom={4}
        data-entityid={draftState.id}
        onClick={handleClick}
      >
        <EntityEditor
          draftState={draftState}
          dispatchEntityEditorState={dispatchEntityEditorState}
        />
      </FullscreenContainer.Row>
    </>
  );
}
