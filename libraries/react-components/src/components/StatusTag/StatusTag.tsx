import type { AdminEntityStatus } from '@dossierhq/core';
import { Tag } from '@dossierhq/design';

interface Props {
  className?: string;
  status: AdminEntityStatus;
}

export function StatusTag({ className, status }: Props) {
  return (
    <Tag className={className} color={status}>
      {status}
    </Tag>
  );
}
