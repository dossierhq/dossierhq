import type { EntityReference, ReferenceFieldSpecification } from '@dossierhq/core';
import { useDisplayEntity } from '../hooks/useDisplayEntity.js';
import { EntityCard } from './EntityCard.js';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<ReferenceFieldSpecification, EntityReference>;

export function ReferenceFieldDisplay({ id, value }: Props) {
  const { entity } = useDisplayEntity(value ?? undefined);

  //TODO make the referenced entity clickable to open it, once display screens support navigation

  if (!entity) {
    return null;
  }
  const { info } = entity;
  return (
    <EntityCard
      id={id}
      name={info.name}
      status={'status' in info ? info.status : undefined}
      type={info.type}
      valid={'validPublished' in info ? info.valid && info.validPublished !== false : info.valid}
    />
  );
}
