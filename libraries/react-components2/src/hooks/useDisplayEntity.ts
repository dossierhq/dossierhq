import type { Entity, EntityReference, PublishedEntity } from '@dossierhq/core';
import { useContext } from 'react';
import { DisplayModeContext } from '../contexts/DisplayModeContext.js';
import { useEntity } from './useEntity.js';
import { usePublishedEntity } from './usePublishedEntity.js';

/** Entity for display components, resolved through the current display mode. */
export function useDisplayEntity(reference: EntityReference | undefined): {
  entity: Entity | PublishedEntity | undefined;
} {
  const mode = useContext(DisplayModeContext);
  const { entity: fullEntity } = useEntity(mode === 'full' ? reference : undefined);
  const { entity: publishedEntity } = usePublishedEntity(
    mode === 'published' ? reference : undefined,
  );
  return { entity: mode === 'full' ? fullEntity : publishedEntity };
}
