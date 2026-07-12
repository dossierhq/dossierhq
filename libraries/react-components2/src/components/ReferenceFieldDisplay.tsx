import type { EntityReference, ReferenceFieldSpecification } from '@dossierhq/core';
import { useEntity } from '../hooks/useEntity.js';
import { EntityCard } from './EntityCard.js';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<ReferenceFieldSpecification, EntityReference>;

export function ReferenceFieldDisplay({ id, value }: Props) {
  const { entity } = useEntity(value ?? undefined);

  //TODO make the referenced entity clickable to open it, once display screens support navigation

  if (!entity) {
    return null;
  }
  return (
    <EntityCard
      id={id}
      name={entity.info.name}
      status={entity.info.status}
      type={entity.info.type}
      valid={entity.info.valid && entity.info.validPublished !== false}
    />
  );
}
