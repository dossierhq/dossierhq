import type { Location } from '@jonasb/datadata-core';
import chalk from 'chalk';
import { showItemSelector } from './ItemSelector';
import { showFloatEdit } from './NumberEdit';

export async function showLocationEdit(
  message: string,
  defaultValue?: Location | null
): Promise<Location | null> {
  let exit = false;
  let lat = defaultValue?.lat ?? null;
  let lng = defaultValue?.lng ?? null;
  while (!exit) {
    const item = await showItemSelector(message, [
      { id: 'lat', name: `Lat: ${lat ?? chalk.gray('<not set>')}` },
      { id: 'lng', name: `Lng: ${lng ?? chalk.gray('<not set>')}` },
      { id: '_done', name: 'Done' },
    ]);
    if (item.id === '_done') {
      exit = true;
    } else if (item.id === 'lat') {
      lat = await showFloatEdit('Lat', lat);
    } else if (item.id === 'lng') {
      lng = await showFloatEdit('Lng', lng);
    }
  }
  if (lat === null || lng === null) {
    return null;
  }
  return { lat, lng };
}
