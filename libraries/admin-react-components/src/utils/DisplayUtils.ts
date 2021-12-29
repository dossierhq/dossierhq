import type { AdminEntityStatus } from '@jonasb/datadata-core';

export function statusDisplay(status: AdminEntityStatus) {
  return status.slice(0, 1).toUpperCase() + status.slice(1);
}
