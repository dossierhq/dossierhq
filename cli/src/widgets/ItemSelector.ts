import inquirer from 'inquirer';

export interface ItemSelectorItem {
  id: string;
  name: string;
}

export interface ItemSelectorSeparator {
  separator: true;
}

function isSeparator(
  item: ItemSelectorItem | ItemSelectorSeparator
): item is ItemSelectorSeparator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(item as any)['separator'];
}

export async function showItemSelector<T extends ItemSelectorItem>(
  message: string,
  items: Array<T | ItemSelectorSeparator>,
  defaultItemId: string | null
): Promise<T> {
  const choices = items.map((a) => {
    if (isSeparator(a)) {
      return new inquirer.Separator();
    }
    return { name: a.name, value: a };
  });
  const defaultItem = defaultItemId
    ? items.find((a) => !isSeparator(a) && a.id === defaultItemId)
    : null;
  const { action } = await inquirer.prompt<{ action: T }>([
    {
      name: 'action',
      type: 'list',
      pageSize: 20,
      message,
      default: defaultItem,
      choices: choices,
    },
  ]);
  return action;
}
