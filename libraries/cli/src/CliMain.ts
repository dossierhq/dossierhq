import { assertIsDefined, EntityPublishState } from '@jonasb/datadata-core';
import type { CliContext } from '.';
import type { ItemSelectorItem, ItemSelectorSeparator } from './widgets';
import { showItemSelector } from './widgets';
import * as CliEntityAdmin from './CliEntityAdmin';
import * as CliPublishedEntity from './CliPublishedEntity';
import * as CliSchema from './CliSchema';
import * as CliUtils from './CliUtils';

interface State {
  readonly context: CliContext;
  currentEntity: { id: string; publishState: EntityPublishState } | null;
}

interface MainActionItem extends ItemSelectorItem {
  action?: () => Promise<void>;
}

function createMainActions(state: State): Array<MainActionItem | ItemSelectorSeparator> {
  return [
    {
      id: 'show-schema',
      name: 'Show schema',
      action: async () => CliSchema.showSchema(state.context),
    },
    { separator: true, name: '─ADMIN────────' },
    {
      id: 'select-admin-entity',
      name: 'Select entity',
      action: async () => {
        const result = await CliEntityAdmin.selectEntity(
          state.context,
          'Select entity',
          null,
          null
        );
        if (result.isOk()) {
          const {
            id,
            info: { publishingState },
          } = result.value;
          state.currentEntity = { id, publishState: publishingState };
        }
      },
    },
    {
      id: 'create-entity',
      name: 'Create entity',
      action: async () => {
        const createdEntity = await CliEntityAdmin.createEntity(state.context);
        if (createdEntity) {
          const {
            id,
            info: { publishingState },
          } = createdEntity;
          state.currentEntity = { id, publishState: publishingState };
        }
      },
    },
    {
      id: 'show-admin-entity',
      name: 'Show entity',
      enabled: !!state.currentEntity,
      action: async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await CliEntityAdmin.showLatestEntity(state.context, state.currentEntity!.id);
      },
    },
    {
      id: 'edit-admin-entity',
      name: 'Edit entity',
      enabled: !!state.currentEntity,
      action: async () => {
        assertIsDefined(state.currentEntity);
        const entity = await CliEntityAdmin.editEntity(state.context, state.currentEntity.id);
        if (entity) {
          state.currentEntity.publishState = entity.info.publishingState;
        }
      },
    },
    {
      id: 'publish-entity',
      name: 'Publish entity',
      enabled: !!state.currentEntity,
      action: async () => {
        assertIsDefined(state.currentEntity);
        const publishState = await CliEntityAdmin.publishEntity(
          state.context,
          state.currentEntity.id
        );
        if (publishState) {
          state.currentEntity.publishState = publishState;
        }
      },
    },
    {
      id: 'unpublish-entity',
      name: 'Unpublish entity',
      enabled:
        !!state.currentEntity &&
        [EntityPublishState.Published, EntityPublishState.Modified].includes(
          state.currentEntity.publishState
        ),
      action: async () => {
        assertIsDefined(state.currentEntity);
        const publishState = await CliEntityAdmin.unpublishEntity(
          state.context,
          state.currentEntity.id
        );
        if (publishState) {
          state.currentEntity.publishState = publishState;
        }
      },
    },
    {
      id: 'archive-entity',
      name: 'Archive entity',
      enabled:
        !!state.currentEntity &&
        [EntityPublishState.Draft, EntityPublishState.Withdrawn].includes(
          state.currentEntity.publishState
        ),
      action: async () => {
        assertIsDefined(state.currentEntity);
        const publishState = await CliEntityAdmin.archiveEntity(
          state.context,
          state.currentEntity.id
        );
        if (publishState) {
          state.currentEntity.publishState = publishState;
        }
      },
    },
    {
      id: 'unarchive-entity',
      name: 'Unarchive entity',
      enabled:
        !!state.currentEntity && state.currentEntity.publishState === EntityPublishState.Archived,
      action: async () => {
        assertIsDefined(state.currentEntity);
        const publishState = await CliEntityAdmin.unarchiveEntity(
          state.context,
          state.currentEntity.id
        );
        if (publishState) {
          state.currentEntity.publishState = publishState;
        }
      },
    },
    {
      id: 'show-entity-history',
      name: 'Show entity history',
      enabled: !!state.currentEntity,
      action: async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await CliEntityAdmin.showEntityHistory(state.context, state.currentEntity!.id);
      },
    },
    {
      id: 'show-publishing-history',
      name: 'Show publishing history',
      enabled: !!state.currentEntity,
      action: async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await CliEntityAdmin.showPublishingHistory(state.context, state.currentEntity!.id);
      },
    },
    {
      id: 'show-entity-version',
      name: 'Show entity version',
      enabled: !!state.currentEntity,
      action: async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await CliEntityAdmin.showEntityVersion(state.context, state.currentEntity!.id);
      },
    },
    { separator: true, name: '─PUBLISHED────' },
    {
      id: 'show-published-entity',
      name: 'Show entity',
      enabled: !!state.currentEntity,
      action: async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await CliPublishedEntity.showEntity(state.context, state.currentEntity!.id);
      },
    },
    { separator: true },
    {
      id: 'exit',
      name: 'Exit',
    },
  ];
}

export async function mainMenu(context: CliContext): Promise<void> {
  const state: State = { context, currentEntity: null };
  let lastActionId = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const mainActions = createMainActions(state);
    const action: MainActionItem = await showItemSelector(
      'What do you want to do?',
      mainActions,
      lastActionId
    );
    if (action.id === 'exit') {
      return;
    }
    try {
      if (action.action) {
        await action.action();
      }
    } catch (error) {
      CliUtils.logError(error);
    }
    lastActionId = action.id;
  }
}
