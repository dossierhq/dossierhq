import { AdminEntityStatus } from '@jonasb/datadata-core';
import React from 'react';
import { Tag } from '../../index.js';
import type { Kind } from '../../index.js';

const LOOKUP: Record<AdminEntityStatus, Kind> = {
  [AdminEntityStatus.archived]: 'danger',
  [AdminEntityStatus.draft]: '',
  [AdminEntityStatus.modified]: 'primary',
  [AdminEntityStatus.published]: 'primary',
  [AdminEntityStatus.withdrawn]: '',
};

interface Props {
  publishState: AdminEntityStatus;
}

export function PublishStateTag({ publishState }: Props): JSX.Element {
  return <Tag kind={LOOKUP[publishState]} text={publishState} />;
}
