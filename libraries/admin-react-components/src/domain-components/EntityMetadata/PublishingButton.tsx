import type { EntityPublishPayload, ErrorType, PromiseResult } from '@jonasb/datadata-core';
import { EntityPublishState } from '@jonasb/datadata-core';
import React, { useContext, useState } from 'react';
import type { DataDataContextValue } from '../..';
import { ButtonWithDropDown, DataDataContext } from '../..';

interface PublishAction {
  name: string;
  handler: () => PromiseResult<EntityPublishPayload | EntityPublishPayload[], ErrorType>;
}

export function PublishingButton({
  entityId,
  publishState,
  latestServerVersion,
}: {
  entityId: string;
  publishState: EntityPublishState | null;
  latestServerVersion: number | null;
}): JSX.Element | null {
  const context = useContext(DataDataContext);
  const [loading, setLoading] = useState(false);

  if (publishState === null || latestServerVersion === null) {
    return null;
  }

  const [buttonAction, ...dropdownActions] = createPublishActions(
    context,
    entityId,
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
  latestServerVersion: number,
  publishState: EntityPublishState
) {
  const { archiveEntity, publishEntities, unarchiveEntity, unpublishEntities } = context;

  let publishActionsIds: Array<'publish' | 'unpublish' | 'archive' | 'unarchive'> = [];
  if ([EntityPublishState.Draft, EntityPublishState.Withdrawn].includes(publishState)) {
    publishActionsIds = ['publish', 'archive'];
  } else if (publishState === EntityPublishState.Published) {
    publishActionsIds = ['unpublish'];
  } else if (publishState === EntityPublishState.Modified) {
    publishActionsIds = ['publish', 'unpublish'];
  } else if (publishState === EntityPublishState.Archived) {
    publishActionsIds = ['unarchive', 'publish'];
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
