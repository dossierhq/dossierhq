import { FileTextIcon } from 'lucide-react';
import { useEntity } from '../hooks/useEntity.js';
import { useSchema } from '../hooks/useSchema.js';
import { cn } from '../lib/utils.js';
import { EmptyStateMessage } from './EmptyStateMessage.js';
import { EntityCard } from './EntityCard.js';
import { EntityFieldDisplay } from './EntityFieldDisplay.js';

interface Props {
  className?: string;
  entityId: string | null;
}

export function EntityDisplay({ className, entityId }: Props) {
  const { entity } = useEntity(entityId ? { id: entityId } : undefined);
  const { schema } = useSchema();
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
        status={entity.info.status}
        type={entity.info.type}
        date={entity.info.updatedAt}
        dateKind="updated"
        valid={entity.info.valid}
      />
      <div className="mb-6 w-full rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
        {entitySpec.fields.map((fieldSpec) => (
          <EntityFieldDisplay
            key={fieldSpec.name}
            fieldSpec={fieldSpec}
            value={entity.fields[fieldSpec.name]}
          />
        ))}
      </div>
    </div>
  );
}
