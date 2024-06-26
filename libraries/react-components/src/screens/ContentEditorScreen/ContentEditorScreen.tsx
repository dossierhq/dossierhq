'use client';

import type { Entity } from '@dossierhq/core';
import {
  Button2,
  Dialog2,
  EmptyStateMessage,
  findAscendantHTMLElement,
  FullscreenContainer,
  Level,
  Row,
  Tag,
  Text,
  useWindowEventListener,
} from '@dossierhq/design';
import {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { AdminEntitySelectorDialog } from '../../components/AdminEntitySelectorDialog/AdminEntitySelectorDialog.js';
import { AdminTypePicker } from '../../components/AdminTypePicker/AdminTypePicker.js';
import { EntityEditor } from '../../components/EntityEditor/EntityEditor.js';
import { DossierContext } from '../../contexts/DossierContext.js';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext.js';
import { EntityEditorStateContext } from '../../contexts/EntityEditorStateContext.js';
import { useAdminEntity } from '../../hooks/useAdminEntity.js';
import {
  EntityEditorActions,
  reduceEntityEditorState,
  type EntityEditorDraftState,
  type EntityEditorState,
  type EntityEditorStateAction,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import {
  initializeEditorEntityStateFromUrlQuery,
  useSynchronizeUrlQueryAndEntityEditorState,
} from '../../reducers/EntityEditorReducer/EntityEditorUrlSynchronizer.js';
import { EntityEditorDraftSidebar } from './EntityEditorDraftSidebar.js';
import { EntityEditorMenu } from './EntityEditorMenu.js';

export interface ContentEditorScreenProps {
  header?: ReactNode;
  footer?: ReactNode;
  urlSearchParams?: Readonly<URLSearchParams>;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
  onEditorHasChangesChange: (hasChanges: boolean) => void;
}

export function ContentEditorScreen({
  header,
  footer,
  urlSearchParams,
  onUrlSearchParamsChange,
  onEditorHasChangesChange,
}: ContentEditorScreenProps) {
  const { schema } = useContext(DossierContext);
  const [entityEditorState, dispatchEntityEditorState] = useReducer(
    reduceEntityEditorState,
    urlSearchParams,
    initializeEditorEntityStateFromUrlQuery,
  );
  const { drafts, activeEntityId, activeEntityMenuScrollSignal, activeEntityEditorScrollSignal } =
    entityEditorState;

  const [showEntitySelector, setShowEntitySelector] = useState(false);
  const handleShowEntitySelector = useCallback(() => setShowEntitySelector(true), []);
  const handleOpenEntityClick = useCallback((entity: Entity) => {
    dispatchEntityEditorState(new EntityEditorActions.AddDraft({ id: entity.id }));
    setShowEntitySelector(false);
  }, []);
  const handleCreateItemClick = useCallback((type: string) => {
    dispatchEntityEditorState(
      new EntityEditorActions.AddDraft({ id: crypto.randomUUID(), newType: type }),
    );
    setShowEntitySelector(false);
  }, []);

  const onCreateEntity = useCallback((type: string) => {
    dispatchEntityEditorState(
      new EntityEditorActions.AddDraft({ id: crypto.randomUUID(), newType: type }),
    );
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
    dispatchEntityEditorState,
  );

  useEffect(() => {
    onEditorHasChangesChange(entityEditorState.status === 'changed');
  }, [entityEditorState.status, onEditorHasChangesChange]);

  useFocusedEntity(entityEditorState, dispatchEntityEditorState);

  const menuScrollToId = activeEntityId ? `${activeEntityId}-menuItem` : undefined;
  const editorScrollToId = activeEntityId ? `${activeEntityId}-header` : undefined;

  return (
    <EntityEditorDispatchContext.Provider value={dispatchEntityEditorState}>
      <EntityEditorStateContext.Provider value={entityEditorState}>
        <FullscreenContainer>
          {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
          <FullscreenContainer.Columns fillHeight>
            <FullscreenContainer.ScrollableColumn
              width="3/12"
              padding={2}
              gap={2}
              scrollToId={menuScrollToId}
              scrollToIdSignal={activeEntityMenuScrollSignal}
            >
              <Row gap={2}>
                <Dialog2.Trigger isOpen={showEntitySelector} onOpenChange={setShowEntitySelector}>
                  <Button2 iconLeft="search" onClick={handleShowEntitySelector}>
                    Open
                  </Button2>
                  <AdminEntitySelectorDialog
                    title="Select entity"
                    onItemClick={handleOpenEntityClick}
                    onCreateItemClick={handleCreateItemClick}
                  />
                </Dialog2.Trigger>
                <AdminTypePicker iconLeft="add" showEntityTypes onTypeSelected={onCreateEntity}>
                  Create
                </AdminTypePicker>
              </Row>
              <EntityEditorMenu
                entityEditorState={entityEditorState}
                dispatchEntityEditorState={dispatchEntityEditorState}
              />
            </FullscreenContainer.ScrollableColumn>
            <FullscreenContainer.ScrollableColumn
              scrollToId={editorScrollToId}
              scrollToIdSignal={activeEntityEditorScrollSignal}
            >
              {drafts.length === 0 ? (
                <EmptyStateMessage
                  icon="add"
                  title="No active entities"
                  message="Create or open an entity"
                />
              ) : (
                drafts.map((draftState) => (
                  <EntityRows
                    key={draftState.id}
                    draftState={draftState}
                    dispatchEntityEditorState={dispatchEntityEditorState}
                  />
                ))
              )}
            </FullscreenContainer.ScrollableColumn>
            <FullscreenContainer.ScrollableColumn width="3/12" padding={2} gap={2}>
              <EntityEditorDraftSidebar entityEditorState={entityEditorState} />
            </FullscreenContainer.ScrollableColumn>
          </FullscreenContainer.Columns>
          {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
        </FullscreenContainer>
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}

function EntityRows({
  draftState,
  dispatchEntityEditorState,
}: {
  draftState: EntityEditorDraftState;
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>;
}) {
  const { client } = useContext(DossierContext);
  const { entity, entityError: _unused } = useAdminEntity(client, { id: draftState.id });

  useEffect(() => {
    if (entity) {
      dispatchEntityEditorState(new EntityEditorActions.UpdateEntity(entity as Entity));
    }
  }, [dispatchEntityEditorState, entity]);

  const handleClick = useCallback(
    (_event: MouseEvent) =>
      dispatchEntityEditorState(
        new EntityEditorActions.SetActiveEntity(draftState.id, true, false),
      ),
    [dispatchEntityEditorState, draftState.id],
  );

  if (!draftState.draft) {
    return null;
  }

  return (
    <>
      <FullscreenContainer.Row id={`${draftState.id}-header`} sticky>
        <Level paddingHorizontal={3}>
          <Level.Left>
            <Level.Item>
              <Text textStyle="headline4">
                {draftState.draft.name || 'Untitled'}{' '}
                <Text as="span" textStyle="headline6">
                  {draftState.draft.entitySpec.name}
                </Text>
              </Text>
            </Level.Item>
          </Level.Left>
          {draftState.status ? (
            <Level.Right>
              <Level.Item>
                <Tag>{draftState.status}</Tag>
              </Level.Item>
            </Level.Right>
          ) : null}
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

function useFocusedEntity(
  entityEditorState: EntityEditorState,
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>,
) {
  const { activeEntityEditorScrollSignal } = entityEditorState;

  const listener = useCallback(
    (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) {
        const selectorElement = findAscendantHTMLElement(
          event.target,
          (el) => !!el.dataset.entityid,
        );
        const entityId = selectorElement?.dataset.entityid;

        if (entityId) {
          dispatchEntityEditorState(new EntityEditorActions.SetActiveEntity(entityId, true, false));
        }
      }
    },
    [dispatchEntityEditorState],
  );
  useWindowEventListener('focusin', listener);

  useEffect(() => {
    if (activeEntityEditorScrollSignal > 0) {
      window.blur();
    }
  }, [activeEntityEditorScrollSignal]);
}
