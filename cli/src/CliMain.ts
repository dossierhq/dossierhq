import type { SessionContext } from '@datadata/core';
import type { ItemSelectorItem, ItemSelectorSeparator } from './widgets';
import { showItemSelector } from './widgets';
import * as CliEntityAdmin from './CliEntityAdmin';
import * as CliPublishedEntity from './CliPublishedEntity';
import * as CliSchema from './CliSchema';
import * as CliUtils from './CliUtils';

interface State {
  readonly context: SessionContext;
  currentEntity: { id: string } | null;
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
          state.currentEntity = result.value;
        }
      },
    },
    {
      id: 'create-entity',
      name: 'Create entity',
      action: async () => {
        const createdEntity = await CliEntityAdmin.createEntity(state.context);
        if (createdEntity) {
          state.currentEntity = createdEntity;
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await CliEntityAdmin.editEntity(state.context, state.currentEntity!.id);
      },
    },
    {
      id: 'delete-entity',
      name: 'Delete entity',
      enabled: !!state.currentEntity,
      action: async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await CliEntityAdmin.deleteEntity(state.context, state.currentEntity!.id);
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
        const entity = await CliPublishedEntity.showEntity(state.context, state.currentEntity!.id);
        if (entity) {
          state.currentEntity = entity;
        }
      },
    },
    { separator: true },
    {
      id: 'exit',
      name: 'Exit',
    },
  ];
}

export async function mainMenu(context: SessionContext): Promise<void> {
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
