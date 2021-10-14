import { EntityPublishState } from '@jonasb/datadata-core';
import { Tag } from '@jonasb/datadata-design';
import React from 'react';

export function StatusTag({ status }: { status: EntityPublishState }) {
  return <Tag color={status}>{status.slice(0, 1).toUpperCase() + status.slice(1)}</Tag>;
}
