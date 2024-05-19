import {
  EntityStatus,
  type Component,
  type DossierClient,
  type Entity,
  type EntityTypeSpecification,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import {
  Button,
  ButtonDropdown,
  NotificationContext,
  Row,
  type NotificationInfo,
} from '@dossierhq/design';
import { useContext, useMemo, type Dispatch } from 'react';
import { DossierContext } from '../../contexts/DossierContext.js';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext.js';
import {
  EntityEditorActions,
  type EntityEditorStateAction,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';

interface Props {
  disabled?: boolean;
  entity: Entity | null;
  entitySpec: EntityTypeSpecification;
}

type PublishingActionId = 'publish' | 'unpublish' | 'archive' | 'unarchive' | 'delete';

interface PublishAction {
  id: PublishingActionId;
  name: string;
}

const successMessages: Record<PublishingActionId, string> = {
  archive: 'Archived entity',
  publish: 'Published entity',
  unarchive: 'Unarchived entity',
  unpublish: 'Unpublished entity',
  delete: 'Deleted entity',
};

const errorMessages: Record<PublishingActionId, string> = {
  archive: 'Failed archiving entity',
  publish: 'Failed publishing entity',
  unarchive: 'Failed unarchiving entity',
  unpublish: 'Failed unpublishing entity',
  delete: 'Failed deleting entity',
};

export function PublishingButton({ disabled, entity, entitySpec }: Props) {
  const { client } = useContext(DossierContext);
  const { showNotification } = useContext(NotificationContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);

  const [buttonAction, ...dropdownActions] = useMemo(
    () => createPublishActions(entity, entitySpec),
    [entity, entitySpec],
  );

  if (!buttonAction) {
    return null;
  }

  return (
    <Row>
      <Button
        disabled={disabled || !buttonAction}
        onClick={
          entity
            ? () =>
                executeAction(
                  buttonAction.id,
                  entity,
                  client,
                  showNotification,
                  dispatchEntityEditorState,
                )
            : undefined
        }
      >
        {buttonAction.name}
      </Button>
      {dropdownActions.length > 0 ? (
        <ButtonDropdown
          disabled={disabled}
          left
          items={dropdownActions}
          renderItem={(it) => it.name}
          onItemClick={
            entity
              ? (it) =>
                  executeAction(it.id, entity, client, showNotification, dispatchEntityEditorState)
              : undefined
          }
        />
      ) : null}
    </Row>
  );
}

function createPublishActions(entity: Entity | null, entitySpec: EntityTypeSpecification) {
  if (!entity) {
    return [];
  }

  const { status } = entity.info;

  let publishActionsIds: Array<PublishingActionId> = [];
  if (status === EntityStatus.draft || status === EntityStatus.withdrawn) {
    publishActionsIds = ['publish', 'archive'];
  } else if (status === EntityStatus.published) {
    publishActionsIds = ['unpublish'];
  } else if (status === EntityStatus.modified) {
    publishActionsIds = ['publish', 'unpublish'];
  } else if (status === EntityStatus.archived) {
    publishActionsIds = ['unarchive', 'publish', 'delete'];
  }

  if (!entitySpec.publishable) {
    publishActionsIds = publishActionsIds.filter((it) => it !== 'publish');
  }

  const publishActions: PublishAction[] = publishActionsIds.map((action) => {
    switch (action) {
      case 'archive':
        return {
          id: 'archive',
          name: 'Archive',
        };
      case 'unarchive':
        return {
          id: 'unarchive',
          name: 'Unarchive',
        };
      case 'publish': {
        return {
          id: 'publish',
          name: 'Publish',
        };
      }
      case 'unpublish':
        return {
          id: 'unpublish',
          name: 'Unpublish',
        };
      case 'delete':
        return {
          id: 'delete',
          name: 'Delete',
        };
    }
  });

  return publishActions;
}

async function executeAction(
  action: PublishingActionId,
  entity: Entity,
  client: DossierClient<Entity<string, object>, Component<string, object>>,
  showNotification: (notification: NotificationInfo) => void,
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>,
) {
  const reference = { id: entity.id };
  let result: Result<unknown, ErrorType>;
  switch (action) {
    case 'archive':
      result = await client.archiveEntity(reference);
      break;
    case 'publish':
      result = await client.publishEntities([{ ...reference, version: entity.info.version }]);
      break;
    case 'unarchive':
      result = await client.unarchiveEntity(reference);
      break;
    case 'unpublish':
      result = await client.unpublishEntities([reference]);
      break;
    case 'delete':
      if (!window.confirm('Are you sure you want to delete this entity?')) {
        return;
      }
      result = await client.deleteEntities([reference]);
      dispatchEntityEditorState(new EntityEditorActions.DeleteDraft(reference.id));
      break;
  }

  if (result.isOk()) {
    showNotification({ color: 'success', message: successMessages[action] });
  } else {
    showNotification({ color: 'error', message: errorMessages[action] });
  }
}
