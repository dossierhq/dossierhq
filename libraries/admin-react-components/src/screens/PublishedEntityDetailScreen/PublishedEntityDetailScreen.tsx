import {
  EmptyStateMessage,
  findAscendantHTMLElement,
  FullscreenContainer,
  Level,
  Text,
  useWindowEventListener,
} from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import { EntityDisplay } from '../../components/EntityDisplay/EntityDisplay.js';
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

export interface PublishedEntityDetailScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  urlSearchParams?: Readonly<URLSearchParams>;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
}

export function PublishedEntityDetailScreen({
  header,
  footer,
  urlSearchParams,
  onUrlSearchParamsChange,
}: PublishedEntityDetailScreenProps): JSX.Element | null {
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
                entityIds.map((entityId) => <EntityRows key={entityId} entityId={entityId} />)
              )}
            </FullscreenContainer.ScrollableColumn>
          </FullscreenContainer.Columns>
          {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
        </FullscreenContainer>
      </EntityDisplayStateContext.Provider>
    </EntityDisplayDispatchContext.Provider>
  );
}

function EntityRows({ entityId }: { entityId: string }) {
  const { publishedClient, schema } = useContext(PublishedDataDataContext);
  const { entity, entityError: _ } = usePublishedEntity(publishedClient, { id: entityId });

  if (!schema || !entity) return null;
  return (
    <>
      <FullscreenContainer.Row id={`${entityId}-header`} sticky>
        <Level>
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
      <EntityDisplay schema={schema} entity={entity} />
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
