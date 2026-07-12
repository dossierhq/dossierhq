import type { FieldSpecification } from '@dossierhq/core';
import { FileTextIcon } from 'lucide-react';
import { useDisplayEntity } from '../hooks/useDisplayEntity.js';
import { useDisplaySchema } from '../hooks/useDisplaySchema.js';
import { cn } from '../lib/utils.js';
import { EmptyStateMessage } from './EmptyStateMessage.js';
import { EntityCard } from './EntityCard.js';
import { EntityFieldDisplay } from './EntityFieldDisplay.js';

interface Props {
  className?: string;
  entityId: string | null;
}

export function EntityDisplay({ className, entityId }: Props) {
  const { entity } = useDisplayEntity(entityId ? { id: entityId } : undefined);
  const { schema } = useDisplaySchema();
  if (!entityId) {
    return (
      <div className={cn(className, 'flex flex-col items-center justify-center')}>
        <EmptyStateMessage
          className="w-full max-w-96"
          icon={<FileTextIcon className="h-full w-full" />}
          title="No selected entity"
        />
      </div>
    );
  }
  if (!entity || !schema) {
    return null;
  }
  const entitySpec = schema.getEntityTypeSpecification(entity.info.type);
  if (!entitySpec) return null;
  return (
    <div className={cn(className, 'flex flex-col')}>
      <EntityCard
        className="mb-2"
        name={entity.info.name}
        status={'status' in entity.info ? entity.info.status : undefined}
        type={entity.info.type}
        date={'updatedAt' in entity.info ? entity.info.updatedAt : entity.info.createdAt}
        dateKind={'updatedAt' in entity.info ? 'updated' : 'created'}
        valid={entity.info.valid}
      />
      <div className="mb-6 w-full rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
        {entitySpec.fields.map((fieldSpec) => (
          <EntityFieldDisplay
            key={fieldSpec.name}
            fieldSpec={fieldSpec as FieldSpecification}
            value={(entity.fields as Record<string, unknown>)[fieldSpec.name]}
          />
        ))}
      </div>
    </div>
  );
}
