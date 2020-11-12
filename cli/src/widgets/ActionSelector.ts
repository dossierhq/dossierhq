import inquirer from 'inquirer';

export interface Action {
  id: string;
  name: string;
  action: () => Promise<void>;
}

export async function showActionSelector(
  message: string,
  actions: Action[],
  defaultActionId: string | null
): Promise<Action> {
  const choices = actions.map((a) => ({ name: a.name, value: a }));
  const defaultAction = defaultActionId ? actions.find((a) => a.id === defaultActionId) : null;
  const { action } = await inquirer.prompt<{ action: Action }>([
    {
      name: 'action',
      type: 'list',
      pageSize: 20,
      message,
      default: defaultAction,
      choices: choices,
    },
  ]);
  return action;
}
