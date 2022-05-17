import type { AdminEntityStatus } from '@jonasb/datadata-core';
import { Tag } from '@jonasb/datadata-design';
import React from 'react';

interface Props {
  status: AdminEntityStatus;
}

export function StatusTag({ status }: Props) {
  return <Tag color={status}>{status}</Tag>;
}
