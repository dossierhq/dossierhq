import type { BoundingBox } from '@datadata/core';
import chalk from 'chalk';
import type { ItemSelectorItem } from './';
import { showFloatEdit, showItemSelector } from './';

export async function showBoundingBoxEdit(
  message: string,
  defaultValue?: BoundingBox | null
): Promise<BoundingBox | null> {
  let exit = false;
  let minLat = defaultValue?.minLat ?? null;
  let maxLat = defaultValue?.maxLat ?? null;
  let minLng = defaultValue?.minLng ?? null;
  let maxLng = defaultValue?.maxLng ?? null;
  let lastItemId: string | null = null;
  while (!exit) {
    const item: ItemSelectorItem = await showItemSelector(
      message,
      [
        { id: 'minLat', name: `Min lat: ${minLat ?? chalk.gray('<not set>')}` },
        { id: 'maxLat', name: `Max lat: ${maxLat ?? chalk.gray('<not set>')}` },
        { id: 'minLng', name: `Min lng: ${minLng ?? chalk.gray('<not set>')}` },
        { id: 'maxLng', name: `Max lng: ${maxLng ?? chalk.gray('<not set>')}` },
        { id: '_done', name: 'Done' },
      ],
      lastItemId
    );
    lastItemId = item.id;
    if (item.id === '_done') {
      exit = true;
    } else if (item.id === 'minLat') {
      minLat = await showFloatEdit('Min lat', minLat);
    } else if (item.id === 'maxLat') {
      maxLat = await showFloatEdit('Max lat', maxLat);
    } else if (item.id === 'minLng') {
      minLng = await showFloatEdit('Min lng', minLng);
    } else if (item.id === 'maxLng') {
      maxLng = await showFloatEdit('Max lng', maxLng);
    }
  }
  if (minLat === null || maxLat === null || minLng === null || maxLng === null) {
    return null;
  }
  return { minLat, maxLat, minLng, maxLng };
}
