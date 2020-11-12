import type { SessionContext } from '@datadata/core';
import type { Action } from './widgets/ActionSelector';
import { showActionSelector } from './widgets/ActionSelector';
import * as CliSchema from './CliSchema';
import * as CliUtils from './CliUtils';

function createMainActions(context: SessionContext): Action[] {
  return [
    {
      id: 'show-schema',
      name: 'Show schema',
      action: async () => CliSchema.showSchema(context),
    },
  ];
}

export async function mainMenu(context: SessionContext): Promise<void> {
  let lastActionId = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const mainActions = createMainActions(context);
    const action: Action = await showActionSelector(
      'What do you want to do?',
      mainActions,
      lastActionId
    );
    try {
      await action.action();
    } catch (error) {
      CliUtils.logError(error);
    }
    lastActionId = action.id;
  }
}
