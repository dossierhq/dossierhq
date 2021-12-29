import type { AdminEntityStatus } from '@jonasb/datadata-core';
import { Tag } from '@jonasb/datadata-design';
import React from 'react';
import { statusDisplay } from '../../utils/DisplayUtils.js';

interface Props {
  status: AdminEntityStatus;
}

export function StatusTag({ status }: Props) {
  return <Tag color={status}>{statusDisplay(status)}</Tag>;
}
