import type { EntityPublishState } from '@jonasb/datadata-core';
import { Tag } from '@jonasb/datadata-design';
import React from 'react';

interface Props {
  status: EntityPublishState;
}

export function StatusTag({ status }: Props) {
  return <Tag color={status}>{status.slice(0, 1).toUpperCase() + status.slice(1)}</Tag>;
}
