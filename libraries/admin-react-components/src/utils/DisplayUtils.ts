import type { EntityPublishState } from '@jonasb/datadata-core';

export function statusDisplay(status: EntityPublishState) {
  return status.slice(0, 1).toUpperCase() + status.slice(1);
}
