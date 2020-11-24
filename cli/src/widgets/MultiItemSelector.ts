import inquirer from 'inquirer';

export interface MultiItemSelectorItem {
  id: string;
  name: string;
  enabled?: boolean;
  selected?: boolean;
}

export interface MultiItemSelectorSeparator {
  separator: true;
  name?: string;
}

function isSeparator(
  item: MultiItemSelectorItem | MultiItemSelectorSeparator
): item is MultiItemSelectorSeparator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(item as any)['separator'];
}

export async function showMultiItemSelector<
  T extends MultiItemSelectorItem = MultiItemSelectorItem
>(message: string, items: Array<T | MultiItemSelectorSeparator>): Promise<T[]> {
  const choices = items.map((a) => {
    if (isSeparator(a)) {
      return { name: a.name, disabled: true };
    }
    if (a.enabled === false) {
      return { name: a.name, disabled: true };
    }
    return { name: a.name, value: a, checked: !!a.selected };
  });
  const result = await inquirer.prompt<{ item: T[] }>([
    {
      name: 'item',
      type: 'checkbox',
      pageSize: 20,
      message,
      choices,
    },
  ]);
  return result.item;
}
