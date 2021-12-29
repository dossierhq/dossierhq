import { AdminEntityStatus } from '@jonasb/datadata-core';
import React from 'react';
import { Tag } from '../../index.js';
import type { Kind } from '../../index.js';

const LOOKUP: Record<AdminEntityStatus, Kind> = {
  [AdminEntityStatus.Archived]: 'danger',
  [AdminEntityStatus.Draft]: '',
  [AdminEntityStatus.Modified]: 'primary',
  [AdminEntityStatus.Published]: 'primary',
  [AdminEntityStatus.Withdrawn]: '',
};

interface Props {
  publishState: AdminEntityStatus;
}

export function PublishStateTag({ publishState }: Props): JSX.Element {
  return <Tag kind={LOOKUP[publishState]} text={publishState} />;
}
