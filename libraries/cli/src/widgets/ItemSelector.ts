import inquirer from 'inquirer';

export interface ItemSelectorItem {
  id: string;
  name: string;
  enabled?: boolean;
}

export interface ItemSelectorSeparator {
  separator: true;
  name?: string;
}

function isSeparator(
  item: ItemSelectorItem | ItemSelectorSeparator
): item is ItemSelectorSeparator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(item as any)['separator'];
}

export async function showItemSelector<T extends ItemSelectorItem = ItemSelectorItem>(
  message: string,
  items: Array<T | ItemSelectorSeparator>,
  defaultItemId: string | null = null
): Promise<T> {
  const choices = items.map((a) => {
    if (isSeparator(a)) {
      return new inquirer.Separator(a.name);
    }
    if (a.enabled === false) {
      return new inquirer.Separator(a.name);
    }
    return { name: a.name, value: a };
  });
  const defaultItem = defaultItemId
    ? items.find((a) => !isSeparator(a) && a.id === defaultItemId)
    : null;
  const { item } = await inquirer.prompt<{ item: T }>([
    {
      name: 'item',
      type: 'list',
      pageSize: 20,
      message,
      default: defaultItem,
      choices,
    },
  ]);
  return item;
}
