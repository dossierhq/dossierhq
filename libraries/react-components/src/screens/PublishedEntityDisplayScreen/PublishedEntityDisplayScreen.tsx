import type { PublishedEntity } from '@dossierhq/core';
import {
  Button,
  Dialog2,
  EmptyStateMessage,
  findAscendantHTMLElement,
  FullscreenContainer,
  Level,
  Tag,
  Text,
  toFlexItemClassName,
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
import { EntityDisplay } from '../../components/EntityDisplay/EntityDisplay.js';
import { PublishedEntitySelectorDialog } from '../../components/PublishedEntitySelectorDialog/PublishedEntitySelectorDialog.js';
import { EntityDisplayDispatchContext } from '../../contexts/EntityDisplayDispatchContext.js';
import { EntityDisplayStateContext } from '../../contexts/EntityDisplayStateContext.js';
import { PublishedDossierContext } from '../../published/contexts/PublishedDossierContext.js';
import { usePublishedEntity } from '../../published/hooks/usePublishedEntity.js';
import {
  EntityDisplayActions,
  reduceEntityDisplayState,
  type EntityDisplayState,
  type EntityDisplayStateAction,
} from '../../reducers/EntityDisplayReducer/EntityDisplayReducer.js';
import {
  initializeEntityDisplayStateFromUrlQuery,
  useSynchronizeUrlQueryAndEntityDisplayState,
} from '../../reducers/EntityDisplayReducer/EntityDisplayUrlSynchronizer.js';
import { EntityDisplayMenu } from './EntityDisplayMenu.js';
import { PublishedEntityLinks } from './PublishedEntityLinks.js';

export interface PublishedEntityDisplayScreenProps {
  header?: ReactNode;
  footer?: ReactNode;
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
  const handleOpenEntityClick = useCallback((entity: PublishedEntity) => {
    dispatchEntityDisplayState(new EntityDisplayActions.AddEntity(entity.id)),
      setShowEntitySelector(false);
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
              <Dialog2.Trigger isOpen={showEntitySelector} onOpenChange={setShowEntitySelector}>
                <Button
                  className={toFlexItemClassName({ alignSelf: 'flex-start' })}
                  iconLeft="search"
                  onClick={handleShowEntitySelector}
                >
                  Open
                </Button>
                <PublishedEntitySelectorDialog
                  title="Select entity"
                  onItemClick={handleOpenEntityClick}
                />
              </Dialog2.Trigger>
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
  const { publishedClient, schema } = useContext(PublishedDossierContext);
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
        {!entity.info.valid ? (
          <div>
            <Tag color="danger">Invalid</Tag>
          </div>
        ) : null}
        <PublishedEntityLinks
          entityReference={{ id: entityId }}
          onItemClick={handleLinkedItemClick}
        />
        <EntityDisplay schema={schema} entity={entity as PublishedEntity} />
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
