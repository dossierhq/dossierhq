import type { PublishedSchema, SchemaWithMigrations } from '@dossierhq/core';
import { useContext } from 'react';
import { DisplayModeContext } from '../contexts/DisplayModeContext.js';
import { usePublishedSchema } from './usePublishedSchema.js';
import { useSchema } from './useSchema.js';

/** Schema for display components, resolved through the current display mode. */
export function useDisplaySchema(): {
  schema: SchemaWithMigrations | PublishedSchema | undefined;
} {
  const mode = useContext(DisplayModeContext);
  const { schema: fullSchema } = useSchema(mode === 'full');
  const { schema: publishedSchema } = usePublishedSchema(mode === 'published');
  return { schema: mode === 'full' ? fullSchema : publishedSchema };
}
