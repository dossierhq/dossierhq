import { AdminEntityStatus } from '@jonasb/datadata-core';
import React from 'react';
import { Tag } from '../..';
import type { LegacyKind } from '../..';

const LOOKUP: Record<AdminEntityStatus, LegacyKind> = {
  [AdminEntityStatus.archived]: 'danger',
  [AdminEntityStatus.draft]: '',
  [AdminEntityStatus.modified]: 'primary',
  [AdminEntityStatus.published]: 'primary',
  [AdminEntityStatus.withdrawn]: '',
};

interface Props {
  publishState: AdminEntityStatus;
}

export function LegacyPublishStateTag({ publishState }: Props): JSX.Element {
  return <Tag kind={LOOKUP[publishState]} text={publishState} />;
}
