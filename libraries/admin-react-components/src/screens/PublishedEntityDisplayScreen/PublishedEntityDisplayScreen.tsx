import type { PublishedEntity } from '@jonasb/datadata-core';
import {
  Button,
  EmptyStateMessage,
  findAscendantHTMLElement,
  FullscreenContainer,
  Level,
  Text,
  toFlexItemClassName,
  useWindowEventListener,
} from '@jonasb/datadata-design';
import type { Dispatch, MouseEvent } from 'react';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { EntityDisplay } from '../../components/EntityDisplay/EntityDisplay.js';
import { PublishedEntitySelectorDialog } from '../../components/PublishedEntitySelectorDialog/PublishedEntitySelectorDialog.js';
import { EntityDisplayDispatchContext } from '../../contexts/EntityDisplayDispatchContext.js';
import { EntityDisplayStateContext } from '../../contexts/EntityDisplayStateContext.js';
import { PublishedDataDataContext } from '../../published/contexts/PublishedDataDataContext.js';
import { usePublishedEntity } from '../../published/hooks/usePublishedEntity.js';
import type {
  EntityDisplayState,
  EntityDisplayStateAction,
} from '../../reducers/EntityDisplayReducer/EntityDisplayReducer.js';
import {
  EntityDisplayActions,
  reduceEntityDisplayState,
} from '../../reducers/EntityDisplayReducer/EntityDisplayReducer.js';
import {
  initializeEntityDisplayStateFromUrlQuery,
  useSynchronizeUrlQueryAndEntityDisplayState,
} from '../../reducers/EntityDisplayReducer/EntityDisplayUrlSynchronizer.js';
import { EntityDisplayMenu } from './EntityDisplayMenu.js';
import { PublishedEntityLinks } from './PublishedEntityLinks.js';

export interface PublishedEntityDisplayScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlSearchParams?: Readonly<URLSearchParams>;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
}

export function PublishedEntityDisplayScreen({
  header,
  footer,
  urlSearchParams,
  onUrlSearchParamsChange,
}: PublishedEntityDisplayScreenProps): JSX.Element | null {
  const [entityDisplayState, dispatchEntityDisplayState] = useReducer(
    reduceEntityDisplayState,
    urlSearchParams,
    initializeEntityDisplayStateFromUrlQuery
  );
  const {
    activeEntityId,
    activeEntityEditorScrollSignal,
    activeEntityMenuScrollSignal,
    entityIds,
  } = entityDisplayState;

  useSynchronizeUrlQueryAndEntityDisplayState(
    urlSearchParams,
    onUrlSearchParamsChange,
    entityDisplayState,
    dispatchEntityDisplayState
  );

  const [showEntitySelector, setShowEntitySelector] = useState(false);
  const handleShowEntitySelector = useCallback(() => setShowEntitySelector(true), []);
  const handleEntitySelectorClose = useCallback(() => setShowEntitySelector(false), []);
  const handleOpenEntityClick = useCallback((entity: PublishedEntity) => {
    dispatchEntityDisplayState(new EntityDisplayActions.AddEntity(entity.id)),
      setShowEntitySelector(false);
  }, []);

  useFocusedEntity(entityDisplayState, dispatchEntityDisplayState);

  const menuScrollToId = activeEntityId ? `${activeEntityId}-menuItem` : undefined;
  const editorScrollToId = activeEntityId ? `${activeEntityId}-header` : undefined;

  return (
    <EntityDisplayDispatchContext.Provider value={dispatchEntityDisplayState}>
      <EntityDisplayStateContext.Provider value={entityDisplayState}>
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
              <Button
                className={toFlexItemClassName({ alignSelf: 'flex-start' })}
                iconLeft="search"
                onClick={handleShowEntitySelector}
              >
                Open
              </Button>
              <EntityDisplayMenu
                entityDisplayState={entityDisplayState}
                dispatchEntityDisplayState={dispatchEntityDisplayState}
              />
            </FullscreenContainer.ScrollableColumn>
            <FullscreenContainer.ScrollableColumn
              scrollToId={editorScrollToId}
              scrollToIdSignal={activeEntityEditorScrollSignal}
            >
              {entityIds.length === 0 ? (
                <EmptyStateMessage icon="add" title="No active entities" message="Open an entity" />
              ) : (
                entityIds.map((entityId) => (
                  <EntityRows
                    key={entityId}
                    entityId={entityId}
                    dispatchEntityDisplayState={dispatchEntityDisplayState}
                  />
                ))
              )}
            </FullscreenContainer.ScrollableColumn>
            <FullscreenContainer.Column width="3/12" />
          </FullscreenContainer.Columns>
          {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
          <PublishedEntitySelectorDialog
            show={showEntitySelector}
            title="Select entity"
            onClose={handleEntitySelectorClose}
            onItemClick={handleOpenEntityClick}
          />
        </FullscreenContainer>
      </EntityDisplayStateContext.Provider>
    </EntityDisplayDispatchContext.Provider>
  );
}

function EntityRows({
  entityId,
  dispatchEntityDisplayState,
}: {
  entityId: string;
  dispatchEntityDisplayState: Dispatch<EntityDisplayStateAction>;
}) {
  const { publishedClient, schema } = useContext(PublishedDataDataContext);
  const { entity, entityError: _ } = usePublishedEntity(publishedClient, { id: entityId });

  const handleClick = useCallback(
    (_event: MouseEvent) =>
      dispatchEntityDisplayState(new EntityDisplayActions.SetActiveEntity(entityId, true, false)),
    [dispatchEntityDisplayState, entityId]
  );

  const handleLinkedItemClick = useCallback(
    (entity: PublishedEntity) => {
      // open entity asynchronously to not fight with the "click to activate entity" functionality
      setTimeout(() => dispatchEntityDisplayState(new EntityDisplayActions.AddEntity(entity.id)));
    },
    [dispatchEntityDisplayState]
  );

  if (!schema || !entity) return null;
  return (
    <>
      <FullscreenContainer.Row id={`${entityId}-header`} sticky>
        <Level paddingHorizontal={3}>
          <Level.Left>
            <Level.Item>
              <Text textStyle="headline4">
                {entity.info.name}{' '}
                <Text as="span" textStyle="headline6">
                  {entity.info.type}
                </Text>
              </Text>
            </Level.Item>
          </Level.Left>
        </Level>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row
        gap={2}
        paddingVertical={4}
        paddingHorizontal={3}
        marginBottom={4}
        data-entityid={entityId}
        onClick={handleClick}
      >
        <PublishedEntityLinks
          entityReference={{ id: entityId }}
          onItemClick={handleLinkedItemClick}
        />
        <EntityDisplay schema={schema} entity={entity} />
      </FullscreenContainer.Row>
    </>
  );
}

function useFocusedEntity(
  entityDisplayState: EntityDisplayState,
  dispatchEntityDisplayState: Dispatch<EntityDisplayStateAction>
) {
  const { activeEntityEditorScrollSignal } = entityDisplayState;

  const listener = useCallback(
    (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) {
        const selectorElement = findAscendantHTMLElement(
          event.target,
          (el) => !!el.dataset.entityid
        );
        const entityId = selectorElement?.dataset.entityid;

        if (entityId) {
          dispatchEntityDisplayState(
            new EntityDisplayActions.SetActiveEntity(entityId, true, false)
          );
        }
      }
    },
    [dispatchEntityDisplayState]
  );
  useWindowEventListener('focusin', listener);

  useEffect(() => {
    if (activeEntityEditorScrollSignal > 0) {
      window.blur();
    }
  }, [activeEntityEditorScrollSignal]);
}
