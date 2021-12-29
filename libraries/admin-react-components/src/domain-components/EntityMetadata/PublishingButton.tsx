import type {
  AdminEntityTypeSpecification,
  EntityPublishPayload,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { AdminEntityStatus } from '@jonasb/datadata-core';
import React, { useContext, useState } from 'react';
import type { DataDataContextValue } from '../../index.js';
import { ButtonWithDropDown, DataDataContext } from '../../index.js';

interface PublishAction {
  name: string;
  handler: () => PromiseResult<EntityPublishPayload | EntityPublishPayload[], ErrorType>;
}

export function PublishingButton({
  entityId,
  entitySpec,
  publishState,
  latestServerVersion,
}: {
  entityId: string;
  entitySpec: AdminEntityTypeSpecification | null;
  publishState: AdminEntityStatus | null;
  latestServerVersion: number | null;
}): JSX.Element | null {
  const context = useContext(DataDataContext);
  const [loading, setLoading] = useState(false);

  if (publishState === null || entitySpec === null || latestServerVersion === null) {
    return null;
  }

  const [buttonAction, ...dropdownActions] = createPublishActions(
    context,
    entityId,
    entitySpec,
    latestServerVersion,
    publishState
  );
  const dropDownItems = dropdownActions.map(({ name, handler }) => ({
    key: name,
    text: name,
    handler,
  }));

  return (
    <ButtonWithDropDown
      id="publish-button"
      kind="primary"
      loading={loading}
      dropDownTitle="Publish actions"
      items={dropDownItems}
      onClick={() => executeHandler(setLoading, buttonAction.handler)}
      onItemClick={(item) => executeHandler(setLoading, item.handler)}
    >
      {buttonAction.name}
    </ButtonWithDropDown>
  );
}

function createPublishActions(
  context: DataDataContextValue,
  entityId: string,
  entitySpec: AdminEntityTypeSpecification,
  latestServerVersion: number,
  publishState: AdminEntityStatus
) {
  const { archiveEntity, publishEntities, unarchiveEntity, unpublishEntities } = context;

  let publishActionsIds: Array<'publish' | 'unpublish' | 'archive' | 'unarchive'> = [];
  if ([AdminEntityStatus.draft, AdminEntityStatus.withdrawn].includes(publishState)) {
    publishActionsIds = ['publish', 'archive'];
  } else if (publishState === AdminEntityStatus.published) {
    publishActionsIds = ['unpublish'];
  } else if (publishState === AdminEntityStatus.modified) {
    publishActionsIds = ['publish', 'unpublish'];
  } else if (publishState === AdminEntityStatus.archived) {
    publishActionsIds = ['unarchive', 'publish'];
  }

  if (entitySpec.adminOnly) {
    publishActionsIds = publishActionsIds.filter((it) => it !== 'publish');
  }

  const publishActions: PublishAction[] = publishActionsIds.map((action) => {
    switch (action) {
      case 'archive':
        return {
          name: 'Archive',
          handler: () => archiveEntity(entityId),
        };

      case 'unarchive':
        return {
          name: 'Unarchive',
          handler: () => unarchiveEntity(entityId),
        };
      case 'publish': {
        return {
          name: 'Publish',
          handler: () => publishEntities([{ id: entityId, version: latestServerVersion }]),
        };
      }
      case 'unpublish':
        return { name: 'Unpublish', handler: () => unpublishEntities([entityId]) };
    }
  });

  return publishActions;
}

async function executeHandler(
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  handler: PublishAction['handler']
) {
  setLoading(true);
  //TODO handle result
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const result = await handler();
  setLoading(false);
}
