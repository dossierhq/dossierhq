import { ClassName, Delete, HoverRevealContainer, Menu, Text } from '@dossierhq/design';
import type { Dispatch, MouseEvent } from 'react';
import { useCallback, useContext } from 'react';
import { PublishedDossierContext } from '../../published/contexts/PublishedDossierContext.js';
import { usePublishedEntity } from '../../published/hooks/usePublishedEntity.js';
import type {
  EntityDisplayState,
  EntityDisplayStateAction,
} from '../../reducers/EntityDisplayReducer/EntityDisplayReducer.js';
import { EntityDisplayActions } from '../../reducers/EntityDisplayReducer/EntityDisplayReducer.js';

interface Props {
  entityDisplayState: Readonly<EntityDisplayState>;
  dispatchEntityDisplayState: Dispatch<EntityDisplayStateAction>;
}

export function EntityDisplayMenu({ entityDisplayState, dispatchEntityDisplayState }: Props) {
  const { activeEntityId, entityIds } = entityDisplayState;

  return (
    <Menu>
      <Menu.List>
        {entityIds.map((entityId) => (
          <MenuItem
            key={entityId}
            entityId={entityId}
            active={activeEntityId === entityId}
            dispatchEntityDisplayState={dispatchEntityDisplayState}
          />
        ))}
      </Menu.List>
    </Menu>
  );
}

function MenuItem({
  active,
  entityId,
  dispatchEntityDisplayState,
}: {
  active: boolean;
  entityId: string;
  dispatchEntityDisplayState: Dispatch<EntityDisplayStateAction>;
}) {
  const { publishedClient } = useContext(PublishedDossierContext);
  const { entity } = usePublishedEntity(publishedClient, { id: entityId });
  const handleItemClick = useCallback(
    () =>
      dispatchEntityDisplayState(new EntityDisplayActions.SetActiveEntity(entityId, false, true)),
    [dispatchEntityDisplayState, entityId]
  );

  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation(); // otherwise it will try to activate the entity after delete
      dispatchEntityDisplayState(new EntityDisplayActions.RemoveEntity(entityId));
    },
    [dispatchEntityDisplayState, entityId]
  );

  if (!entity) return null;
  return (
    <Menu.Item>
      <a
        id={`${entityId}-menuItem`}
        className={active ? ClassName['is-active'] : undefined}
        onClick={handleItemClick}
      >
        <HoverRevealContainer>
          <HoverRevealContainer.Item forceVisible flexGrow={1}>
            <Text textStyle="body2">{entity.info.type}</Text>
            <Text textStyle="body1">{entity.info.name}</Text>
          </HoverRevealContainer.Item>
          <HoverRevealContainer.Item>
            <Delete onClick={handleDeleteClick} />
          </HoverRevealContainer.Item>
        </HoverRevealContainer>
      </a>
    </Menu.Item>
  );
}
