import type { SessionContext } from '@datadata/core';
import type { ItemSelectorItem, ItemSelectorSeparator } from './widgets/ItemSelector';
import { showItemSelector } from './widgets/ItemSelector';
import * as CliEntityAdmin from './CliEntityAdmin';
import * as CliSchema from './CliSchema';
import * as CliUtils from './CliUtils';

interface MainActionItem extends ItemSelectorItem {
  action?: () => Promise<void>;
}

function createMainActions(context: SessionContext): Array<MainActionItem | ItemSelectorSeparator> {
  return [
    {
      id: 'show-schema',
      name: 'Show schema',
      action: async () => CliSchema.showSchema(context),
    },
    { separator: true },
    {
      id: 'create-entity',
      name: 'Create entity',
      action: async () => {
        const result = await CliEntityAdmin.createEntity(context);
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
  let lastActionId = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const mainActions = createMainActions(context);
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
