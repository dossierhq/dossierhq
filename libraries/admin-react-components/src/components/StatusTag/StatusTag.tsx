import type { AdminEntityStatus } from '@jonasb/datadata-core';
import { Tag } from '@jonasb/datadata-design';

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
