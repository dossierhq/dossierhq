import {
  EntityStatus,
  type DossierClient,
  type Entity,
  type EntityTypeSpecification,
  type Component,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import type { NotificationInfo } from '@dossierhq/design';
import { Button, ButtonDropdown, NotificationContext, Row } from '@dossierhq/design';
import { useContext, useMemo } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';

interface Props {
  disabled?: boolean;
  entity: Entity | null;
  entitySpec: EntityTypeSpecification;
}

type PublishingActionId = 'publish' | 'unpublish' | 'archive' | 'unarchive';

interface PublishAction {
  id: PublishingActionId;
  name: string;
}

const successMessages: Record<PublishingActionId, string> = {
  archive: 'Archived entity',
  publish: 'Published entity',
  unarchive: 'Unarchived entity',
  unpublish: 'Unpublished entity',
};

const errorMessages: Record<PublishingActionId, string> = {
  archive: 'Failed archiving entity',
  publish: 'Failed publishing entity',
  unarchive: 'Failed unarchiving entity',
  unpublish: 'Failed unpublishing entity',
};

export function PublishingButton({ disabled, entity, entitySpec }: Props) {
  const { adminClient } = useContext(AdminDossierContext);
  const { showNotification } = useContext(NotificationContext);

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
            ? () => executeAction(buttonAction.id, entity, adminClient, showNotification)
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
            entity ? (it) => executeAction(it.id, entity, adminClient, showNotification) : undefined
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
    publishActionsIds = ['unarchive', 'publish'];
  }

  if (entitySpec.adminOnly) {
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
    }
  });

  return publishActions;
}

async function executeAction(
  action: PublishingActionId,
  entity: Entity,
  adminClient: DossierClient<Entity<string, object>, Component<string, object>>,
  showNotification: (notification: NotificationInfo) => void,
) {
  const reference = { id: entity.id };
  let result: Result<unknown, ErrorType>;
  switch (action) {
    case 'archive':
      result = await adminClient.archiveEntity(reference);
      break;
    case 'publish':
      result = await adminClient.publishEntities([{ ...reference, version: entity.info.version }]);
      break;
    case 'unarchive':
      result = await adminClient.unarchiveEntity(reference);
      break;
    case 'unpublish':
      result = await adminClient.unpublishEntities([reference]);
      break;
  }

  if (result.isOk()) {
    showNotification({ color: 'success', message: successMessages[action] });
  } else {
    showNotification({ color: 'error', message: errorMessages[action] });
  }
}
