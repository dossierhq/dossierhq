import { AdminEntityStatus, assertExhaustive } from '@jonasb/datadata-core';
import type { EntitiesTable } from '../DatabaseSchema';

export function resolveEntityStatus(status: EntitiesTable['status']): AdminEntityStatus {
  switch (status) {
    case 'draft':
      return AdminEntityStatus.draft;
    case 'published':
      return AdminEntityStatus.published;
    case 'modified':
      return AdminEntityStatus.modified;
    case 'withdrawn':
      return AdminEntityStatus.withdrawn;
    case 'archived':
      return AdminEntityStatus.archived;
    default:
      assertExhaustive(status);
  }
}
