import type { EntityStatus } from '@dossierhq/core';
import { Tag } from '@dossierhq/design';

interface Props {
  className?: string;
  status: EntityStatus;
}

export function StatusTag({ className, status }: Props) {
  return (
    <Tag className={className} color={status}>
      {status}
    </Tag>
  );
}
